"""add page sections table

Revision ID: 9b2d3e4e8f3c
Revises: c4f0c020069a
Create Date: 2025-02-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9b2d3e4e8f3c'
down_revision = 'c4f0c020069a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'page_sections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), server_onupdate=sa.text('now()'), nullable=False),
        sa.Column('page_id', sa.Integer(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('section_type', sa.String(length=32), nullable=False),
        sa.Column('header', sa.Text(), nullable=True),
        sa.Column('text', sa.Text(), nullable=True),
        sa.Column('media_url', sa.Text(), nullable=True),
        sa.Column('caption', sa.Text(), nullable=True),
        sa.Column('code', sa.Text(), nullable=True),
        sa.Column('language', sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('page_id', 'position', name='uq_page_sections_page_position')
    )
    op.create_index(op.f('ix_page_sections_id'), 'page_sections', ['id'], unique=False)
    op.create_index(op.f('ix_page_sections_page_id'), 'page_sections', ['page_id'], unique=False)
    op.create_index(op.f('ix_page_sections_position'), 'page_sections', ['position'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_page_sections_position'), table_name='page_sections')
    op.drop_index(op.f('ix_page_sections_page_id'), table_name='page_sections')
    op.drop_index(op.f('ix_page_sections_id'), table_name='page_sections')
    op.drop_table('page_sections')
