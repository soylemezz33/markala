import { describe, it, expect, vi, beforeEach } from "vitest";

// Zustand persist localStorage mock — jsdom ortamında otomatik gelir ama sıfırlama gerekiyor.
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

// Dinamik import: her test öncesinde modülü sıfırlamamız gerekiyor (Zustand singleton).
// Bu yüzden store'u doğrudan import yerine factory ile aldık.
async function freshStore() {
  vi.resetModules();
  const mod = await import("@/lib/cart-store");
  // Store başlangıç durumuna resetle (Zustand v4/v5 uyumlu).
  mod.useCartStore.setState({ items: [], isOpen: false });
  return mod.useCartStore;
}

const ITEM_A = {
  productSlug: "klasik-kartvizit",
  productName: "Klasik Kartvizit",
  productImage: "https://cdn.markala.com.tr/img.jpg",
  configuration: {
    selections: { varyant: "cyp-1000" },
    summary: "CYP · 1.000 adet",
    totalPrice: 290,
    needsDesign: false,
  },
};

describe("useCartStore — addItem", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("sepete ürün eklenir, isOpen true olur", async () => {
    const store = await freshStore();
    store.getState().addItem(ITEM_A);

    expect(store.getState().items).toHaveLength(1);
    expect(store.getState().isOpen).toBe(true);
  });

  it("aynı ürün iki kez eklenmesi → 2 ayrı satır (id farklı)", async () => {
    const store = await freshStore();
    store.getState().addItem(ITEM_A);
    store.getState().addItem(ITEM_A);

    const items = store.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].id).not.toBe(items[1].id);
  });

  it("varsayılan miktar 1 olur", async () => {
    const store = await freshStore();
    store.getState().addItem(ITEM_A);

    expect(store.getState().items[0].quantity).toBe(1);
  });

  it("özel miktar geçirilirse kullanılır", async () => {
    const store = await freshStore();
    store.getState().addItem({ ...ITEM_A, quantity: 5 });

    expect(store.getState().items[0].quantity).toBe(5);
  });
});

describe("useCartStore — removeItem", () => {
  it("belirtilen id kaldırılır, diğerleri kalır", async () => {
    const store = await freshStore();
    store.getState().addItem(ITEM_A);
    store.getState().addItem(ITEM_A);

    const [first] = store.getState().items;
    store.getState().removeItem(first.id);

    expect(store.getState().items).toHaveLength(1);
    expect(store.getState().items[0].id).not.toBe(first.id);
  });
});

describe("useCartStore — updateQuantity", () => {
  it("miktar güncellenir", async () => {
    const store = await freshStore();
    store.getState().addItem(ITEM_A);
    const { id } = store.getState().items[0];

    store.getState().updateQuantity(id, 10);

    expect(store.getState().items[0].quantity).toBe(10);
  });

  it("0 verilirse minimum 1'e sabitleniyor", async () => {
    const store = await freshStore();
    store.getState().addItem(ITEM_A);
    const { id } = store.getState().items[0];

    store.getState().updateQuantity(id, 0);

    expect(store.getState().items[0].quantity).toBe(1);
  });
});

describe("useCartStore — clear", () => {
  it("sepeti tamamen temizler", async () => {
    const store = await freshStore();
    store.getState().addItem(ITEM_A);
    store.getState().addItem(ITEM_A);

    store.getState().clear();

    expect(store.getState().items).toHaveLength(0);
  });
});

describe("useCartStore — computed selectors", () => {
  it("itemCount toplam miktarı döndürür (2 satır × quantity)", async () => {
    const store = await freshStore();
    store.getState().addItem({ ...ITEM_A, quantity: 3 });
    store.getState().addItem({ ...ITEM_A, quantity: 2 });

    expect(store.getState().itemCount()).toBe(5);
  });

  it("subtotal: fiyat × miktar toplamı", async () => {
    const store = await freshStore();
    // 290 × 1 = 290
    store.getState().addItem(ITEM_A);

    expect(store.getState().subtotal()).toBeCloseTo(290, 2);
  });

  it("boş sepette subtotal = 0", async () => {
    const store = await freshStore();
    expect(store.getState().subtotal()).toBe(0);
  });
});

describe("useCartStore — drawer toggle", () => {
  it("open/close/toggle çalışıyor", async () => {
    const store = await freshStore();
    // Başlangıçta kapalı
    expect(store.getState().isOpen).toBe(false);

    store.getState().open();
    expect(store.getState().isOpen).toBe(true);

    store.getState().close();
    expect(store.getState().isOpen).toBe(false);

    store.getState().toggle();
    expect(store.getState().isOpen).toBe(true);
  });
});
