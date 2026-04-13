-- Migration: Fix finance sync data integrity
-- Context: OMIE sync had multiple issues causing broken /financeiro data:
--   1. Category types all set to "despesa" (OMIE id_tipo_lancamento unreliable)
--   2. Missing 2.xx expense categories (not returned by OMIE ListarCategorias)
--   3. 77% of transactions had no category_id (lookup failures)
--   4. 98% had no business_unit (no cost center data from OMIE)
--   5. finance_snapshots_daily empty (KPIs and charts showed R$0)
--   6. 55 overdue transactions still showing as "previsto"
--
-- This migration:
--   a) Expands business_unit check constraint to include all TBO BUs
--   b) Fixes are applied live via post-sync reconciliation code

-- 1. Expand business_unit check constraint
ALTER TABLE finance_transactions
  DROP CONSTRAINT IF EXISTS finance_transactions_business_unit_check;

ALTER TABLE finance_transactions
  ADD CONSTRAINT finance_transactions_business_unit_check CHECK (
    business_unit IS NULL OR business_unit = ANY (ARRAY[
      'Branding', 'Digital 3D', 'Marketing', 'Audiovisual', 'Interiores',
      'Performance', 'Social & Conteúdo', 'Design', 'Administrativo',
      'Comercial', 'Tecnologia', 'Produção', 'RH'
    ])
  );
