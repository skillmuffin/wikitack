"""Add unique constraint for workspace slug

Revision ID: 41c63ebcf2cd
Revises: 79d79b3aa603
Create Date: 2025-11-20 11:38:26.573815

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '41c63ebcf2cd'
down_revision = '79d79b3aa603'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add unique constraint on (workspace_id, slug) for spaces table
    # This ensures space slugs are unique within each workspace
    op.create_unique_constraint(
        'uq_workspace_space_slug',
        'spaces',
        ['workspace_id', 'slug']
    )


def downgrade() -> None:
    # Remove unique constraint
    op.drop_constraint('uq_workspace_space_slug', 'spaces', type_='unique')
