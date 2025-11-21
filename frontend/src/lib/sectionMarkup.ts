import { PageSection, SectionType } from "@/types/wiki";

type BlockMeta = {
  type: SectionType | "code";
  header?: string;
  context?: string;
  body: string[];
};

const START_REGEX =
  /^:::(info|warning|error|snippet|code|paragraph|picture)(?:\s+(\S+))?(?::\s*(.*)|\s+(.*))?$/i;
const END_REGEX = /^:::end\s*$/i;

const normalizeType = (rawType: string): SectionType => {
  const lowered = rawType.toLowerCase();
  return (lowered === "code" ? "snippet" : lowered) as SectionType;
};

const pushParagraph = (sections: PageSection[], lines: string[]) => {
  const text = lines.join("\n").trim();
  if (!text) return;

  sections.push({
    sectionType: "paragraph",
    position: sections.length,
    text,
  });
};

export const parseSectionMarkup = (input: string): PageSection[] => {
  const sections: PageSection[] = [];
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  let block: BlockMeta | null = null;
  let looseParagraph: string[] = [];

  const flushBlock = () => {
    if (!block) return;
    const sectionType = normalizeType(block.type);
    const bodyText = block.body.join("\n").trimEnd();

    if (sectionType === "snippet") {
      if (!bodyText.trim()) {
        throw new Error("snippet blocks require code");
      }
      sections.push({
        sectionType,
        position: sections.length,
        header: block.header || null,
        code: bodyText,
        language: block.context || "text",
      });
    } else if (sectionType === "picture") {
      const mediaUrl = block.context || bodyText.split("\n").find(Boolean)?.trim() || "";
      if (mediaUrl) {
        sections.push({
          sectionType,
          position: sections.length,
          mediaUrl,
          caption: block.header || null,
          text: bodyText && block.context ? bodyText : null,
        });
      }
    } else {
      const text = bodyText.trim();
      const isNotice = ["info", "warning", "error"].includes(sectionType);
      const fallbackText = text || block.header || block.context || "";

      if (isNotice && !fallbackText.trim()) {
        throw new Error(`${sectionType} blocks require text`);
      }

      if (block.header || text || isNotice) {
        sections.push({
          sectionType,
          position: sections.length,
          header: block.header || null,
          text: fallbackText || null,
        });
      }
    }

    block = null;
  };

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();

    const startMatch = trimmed.match(START_REGEX);
    const isEnd = END_REGEX.test(trimmed);
    const isDirective = trimmed.startsWith(":::");

    if (block) {
      if (isEnd) {
        flushBlock();
        return;
      }
      block.body.push(rawLine);
      return;
    }

    if (startMatch) {
      flushBlock();
      pushParagraph(sections, looseParagraph);
      looseParagraph = [];

      const [, type, context, headerWithColon, headerWithSpace] = startMatch;
      const normalizedType = normalizeType(type);

      let header = headerWithColon ?? headerWithSpace;
      let contextValue: string | undefined = context;

      // For non-snippet blocks, treat a lone token as header when no explicit header is given.
      if (!header && contextValue && normalizedType !== "snippet" && normalizedType !== "picture") {
        header = contextValue;
        contextValue = undefined;
      }

      block = {
        type: normalizedType,
        header: header || undefined,
        context: contextValue,
        body: [],
      };
      return;
    }

    if (isEnd) {
      return;
    }

    if (isDirective && !startMatch && !isEnd) {
      throw new Error(`Unknown directive on line ${idx + 1}: ${trimmed}`);
    }

    looseParagraph.push(rawLine);
  });

  flushBlock();
  pushParagraph(sections, looseParagraph);

  return sections.map((section, position) => ({ ...section, position }));
};

export const sectionsToMarkup = (sections: PageSection[]): string => {
  if (!sections?.length) return "";

  const blocks = sections
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((section) => {
      if (section.sectionType === "snippet") {
        const language = section.language || "text";
        const header = section.header ? `: ${section.header}` : "";
        return [`:::code ${language}${header}`, section.code || "", ":::end"].join("\n");
      }

      if (section.sectionType === "picture") {
        const url = section.mediaUrl || "";
        const header = section.caption || section.header;
        const body = section.text ? `\n${section.text}` : "";
        return `:::picture ${url}${header ? `: ${header}` : ""}${body}\n:::end`;
      }

      const header = section.header ? `: ${section.header}` : "";
      const body = section.text || "";
      return [`:::${section.sectionType}${header}`, body, ":::end"].join("\n");
    })
    .filter(Boolean);

  return blocks.join("\n\n").trim();
};
