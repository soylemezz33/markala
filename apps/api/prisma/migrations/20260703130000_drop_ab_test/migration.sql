-- Kullanılmayan A/B testing modelleri kaldırıldı (kod tarafında 0 referans).
-- Modeller: AbTest (ab_tests), AbTestEvent (ab_test_events).

-- DropForeignKey
ALTER TABLE "ab_test_events" DROP CONSTRAINT "ab_test_events_test_id_fkey";

-- DropTable
DROP TABLE "ab_tests";

-- DropTable
DROP TABLE "ab_test_events";
