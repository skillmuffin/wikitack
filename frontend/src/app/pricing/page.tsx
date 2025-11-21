"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WikiHeader from "@/components/WikiHeader";

export default function PricingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for personal use and small teams",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        "Up to 5 team members",
        "50 pages",
        "Basic version history",
        "5 GB storage",
        "Community support",
        "Custom markup language",
      ],
      cta: "Get Started",
      highlighted: false,
      gradient: "from-zinc-600 to-zinc-800",
    },
    {
      name: "Professional",
      description: "For growing teams and businesses",
      monthlyPrice: 29,
      annualPrice: 290,
      features: [
        "Up to 25 team members",
        "Unlimited pages",
        "Advanced version history",
        "100 GB storage",
        "Priority email support",
        "Custom markup language",
        "Advanced search",
        "Role-based permissions",
        "API access",
      ],
      cta: "Start Free Trial",
      highlighted: true,
      gradient: "from-blue-600 to-purple-600",
    },
    {
      name: "Enterprise",
      description: "For large organizations with custom needs",
      monthlyPrice: 99,
      annualPrice: 990,
      features: [
        "Unlimited team members",
        "Unlimited pages",
        "Complete version history",
        "1 TB storage",
        "24/7 phone & email support",
        "Custom markup language",
        "Advanced search",
        "Custom roles & permissions",
        "API access",
        "SSO & SAML",
        "Dedicated account manager",
        "Custom integrations",
      ],
      cta: "Contact Sales",
      highlighted: false,
      gradient: "from-purple-600 to-pink-600",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <WikiHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl animate-pulse"></div>
          <div className="absolute right-1/4 bottom-20 h-96 w-96 rounded-full bg-purple-400/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Heading */}
          <div
            className={`mb-12 text-center transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-transparent dark:from-white dark:via-zinc-300 dark:to-white">
                Simple, Transparent
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Choose the perfect plan for your team. Always know what you'll pay.
            </p>
          </div>

          {/* Billing Toggle */}
          <div
            className={`mb-12 flex items-center justify-center gap-4 transition-all duration-1000 delay-300 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <span
              className={`text-sm font-medium ${
                billingCycle === "monthly"
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                billingCycle === "annual"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <div
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                  billingCycle === "annual" ? "translate-x-7" : "translate-x-1"
                }`}
              ></div>
            </button>
            <span
              className={`text-sm font-medium ${
                billingCycle === "annual"
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              Annual
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Save 17%
              </span>
            </span>
          </div>

          {/* Pricing Cards */}
          <div
            className={`grid gap-8 lg:grid-cols-3 transition-all duration-1000 delay-500 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`group relative rounded-2xl border p-8 transition-all duration-300 ${
                  plan.highlighted
                    ? "scale-105 border-transparent bg-white shadow-2xl dark:bg-zinc-900"
                    : "border-zinc-200 bg-white/50 backdrop-blur-sm hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Highlighted Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Gradient Border Effect for Highlighted Plan */}
                {plan.highlighted && (
                  <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 opacity-20 blur-xl"></div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-zinc-900 dark:text-white">
                      ${billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  {billingCycle === "annual" && plan.annualPrice > 0 && (
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                      ${(plan.annualPrice / 12).toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <Link
                  href="/login"
                  className={`mb-6 block w-full rounded-lg px-6 py-3 text-center font-semibold shadow-md transition-all duration-300 ${
                    plan.highlighted
                      ? `bg-gradient-to-r ${plan.gradient} text-white hover:scale-105 hover:shadow-xl`
                      : "border-2 border-zinc-300 bg-white text-zinc-900 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:border-zinc-600"
                  }`}
                >
                  {plan.cta}
                </Link>

                {/* Features List */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className={`h-5 w-5 shrink-0 ${
                          plan.highlighted
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* FAQ or Additional Info */}
          <div
            className={`mt-20 text-center transition-all duration-1000 delay-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-white">
              Need a custom plan?
            </h2>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              Contact our sales team for custom pricing and features tailored to your organization.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-900 transition-all hover:border-zinc-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:border-zinc-600"
            >
              Contact Sales
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              © 2025 WikiTack. Built with FastAPI, Next.js, and PostgreSQL.
            </p>
          </div>
        </div>
      </footer>
      </div>
  );
}
