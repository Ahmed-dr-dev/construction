-- ============================================================
-- Migration RBAC : ajout des rôles responsable et personnel
-- ============================================================

-- 1. Supprimer l'ancienne contrainte de rôle
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Ajouter la nouvelle contrainte avec tous les rôles
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'responsable', 'personnel', 'comptable', 'employee'));

-- 3. Migrer les anciens rôles (optionnel — adapter selon votre contexte)
-- UPDATE users SET role = 'personnel'   WHERE role = 'employee';
-- UPDATE users SET role = 'responsable' WHERE role = 'comptable';

-- 4. Vérifier la migration
SELECT role, COUNT(*) AS total FROM users GROUP BY role ORDER BY role;
