import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore } from "@/lib/cart-store";

// GA4 track() çağrısını izole et — analytics network bağımlılığı test dışı
vi.mock("@/lib/analytics", () => ({ track: vi.fn(), trackAddToCart: vi.fn() }));

function makeItem(totalPrice = 290) {
  return {
    productSlug: "klasik-kartvizit",
    productName: "Klasik Kartvizit",
    productImage: "/images/kartvizit.jpg",
    configuration: {
      selections: { varyant: "cyp-1000" },
      summary: "CYP | 1.000 adet",
      totalPrice,
      needsDesign: false,
    },
  };
}

describe("useCartStore", () => {
  beforeEach(() => {
    // Persist middleware metodları tutarken sadece veriyi sıfırla (replace=true metodları kaldırır)
    useCartStore.setState({ items: [], isOpen: false });
  });

  // === addItem ===

  it("addItem: ürün eklenir, cart açılır, eşsiz id atanır", () => {
    useCartStore.getState().addItem(makeItem());
    const { items, isOpen } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(isOpen).toBe(true);
    expect(items[0].id).toBeDefined();
    expect(items[0].productSlug).toBe("klasik-kartvizit");
  });

  it("addItem: quantity belirtilmezse 1 kullanılır", () => {
    useCartStore.getState().addItem(makeItem());
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("addItem: quantity belirtilirse korunur", () => {
    useCartStore.getState().addItem({ ...makeItem(), quantity: 3 });
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it("addItem: her çağrı benzersiz id üretir — aynı ürünün farklı konfigleri ayrı satır", () => {
    useCartStore.getState().addItem(makeItem());
    useCartStore.getState().addItem(makeItem());
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
    expect(items[0].id).not.toBe(items[1].id);
  });

  // === removeItem ===

  it("removeItem: var olan id'yi siler", () => {
    useCartStore.getState().addItem(makeItem());
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(id);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("removeItem: olmayan id için state değişmez", () => {
    useCartStore.getState().addItem(makeItem());
    useCartStore.getState().removeItem("yok-boyle-bir-id");
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("removeItem: birden fazla ürün varken sadece hedeflenen silinir", () => {
    useCartStore.getState().addItem(makeItem(290));
    useCartStore.getState().addItem({ ...makeItem(150), productSlug: "etiket" });
    const idToRemove = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(idToRemove);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].productSlug).toBe("etiket");
  });

  // === updateQuantity ===

  it("updateQuantity: adet güncellenir", () => {
    useCartStore.getState().addItem(makeItem());
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 10);
    expect(useCartStore.getState().items[0].quantity).toBe(10);
  });

  it("updateQuantity: 0 → 1'e clamp edilir (minimum 1)", () => {
    useCartStore.getState().addItem(makeItem());
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("updateQuantity: negatif → 1'e clamp edilir", () => {
    useCartStore.getState().addItem(makeItem());
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, -99);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  // === clear ===

  it("clear: tüm ürünleri temizler", () => {
    useCartStore.getState().addItem(makeItem());
    useCartStore.getState().addItem(makeItem());
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  // === open / close / toggle ===

  it("open → isOpen true, close → false", () => {
    useCartStore.getState().open();
    expect(useCartStore.getState().isOpen).toBe(true);
    useCartStore.getState().close();
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it("toggle: false → true → false", () => {
    useCartStore.setState({ isOpen: false });
    useCartStore.getState().toggle();
    expect(useCartStore.getState().isOpen).toBe(true);
    useCartStore.getState().toggle();
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  // === itemCount ===

  it("itemCount: boş sepette 0", () => {
    expect(useCartStore.getState().itemCount()).toBe(0);
  });

  it("itemCount: quantity'lerin toplamını verir", () => {
    useCartStore.getState().addItem({ ...makeItem(), quantity: 2 });
    useCartStore.getState().addItem({ ...makeItem(), quantity: 3 });
    expect(useCartStore.getState().itemCount()).toBe(5);
  });

  // === subtotal ===

  it("subtotal: boş sepette 0", () => {
    expect(useCartStore.getState().subtotal()).toBe(0);
  });

  it("subtotal: fiyat × adet toplamını verir", () => {
    useCartStore.getState().addItem({ ...makeItem(100), quantity: 2 });
    useCartStore.getState().addItem({ ...makeItem(50), quantity: 3 });
    // 100 × 2 + 50 × 3 = 350
    expect(useCartStore.getState().subtotal()).toBe(350);
  });

  it("subtotal: updateQuantity sonrası güncellenir", () => {
    useCartStore.getState().addItem(makeItem(200));
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 5);
    expect(useCartStore.getState().subtotal()).toBe(1000);
  });
});
