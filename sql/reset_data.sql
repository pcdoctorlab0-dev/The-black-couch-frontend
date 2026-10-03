-- Resets episodes, products, product_variants, orders, and order_items
-- to empty, so the site starts genuinely blank until the admin adds
-- content through /admin/episodes and /admin/products. Does NOT touch
-- users or admin_users — nobody's account is affected.
--
-- Run this against your actual database (TiDB Cloud or local MySQL).
-- Adjust table/column names first if your live schema differs from the
-- names used throughout this project's admin pages and API contract.

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE product_variants;
TRUNCATE TABLE products;
TRUNCATE TABLE episodes;
-- If you store uploaded payment-proof files on disk (not just DB rows),
-- also clear that folder's contents by hand — TRUNCATE only clears the
-- database row, not any file it pointed to.

SET FOREIGN_KEY_CHECKS = 1;

-- If your MySQL/TiDB version rejects SET FOREIGN_KEY_CHECKS, delete in
-- this order instead (children before parents), then reset auto-increment:
--
-- DELETE FROM order_items;
-- DELETE FROM orders;
-- DELETE FROM product_variants;
-- DELETE FROM products;
-- DELETE FROM episodes;
-- ALTER TABLE order_items AUTO_INCREMENT = 1;
-- ALTER TABLE orders AUTO_INCREMENT = 1;
-- ALTER TABLE product_variants AUTO_INCREMENT = 1;
-- ALTER TABLE products AUTO_INCREMENT = 1;
-- ALTER TABLE episodes AUTO_INCREMENT = 1;
