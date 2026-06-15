// Event taxonomy — canonical event names ve property contract'ları.
// Frontend ve backend aynı sabit isimleri kullanır; bu dosya tek kaynak.

export const EVENTS = {
  // --- Ürün keşif ---
  PRODUCT_VIEWED: "product_viewed",
  PRODUCT_LIST_VIEWED: "product_list_viewed",
  PRODUCT_SEARCHED: "product_searched",
  CATEGORY_VIEWED: "category_viewed",

  // --- Sepet ---
  CART_ITEM_ADDED: "cart_item_added",
  CART_ITEM_REMOVED: "cart_item_removed",
  CART_ITEM_QUANTITY_CHANGED: "cart_item_quantity_changed",
  CART_VIEWED: "cart_viewed",
  CART_ABANDONED: "cart_abandoned",

  // --- Ödeme hunisi ---
  CHECKOUT_STARTED: "checkout_started",
  CHECKOUT_STEP_COMPLETED: "checkout_step_completed",
  COUPON_APPLIED: "coupon_applied",
  COUPON_REJECTED: "coupon_rejected",
  PAYMENT_INITIATED: "payment_initiated",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_FAILED: "payment_failed",

  // --- Sipariş ---
  ORDER_PLACED: "order_placed",
  ORDER_STATUS_CHANGED: "order_status_changed",
  DESIGN_UPLOAD_STARTED: "design_upload_started",
  DESIGN_UPLOAD_COMPLETED: "design_upload_completed",

  // --- Kullanıcı ---
  USER_REGISTERED: "user_registered",
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",
  CORPORATE_APPLICATION_SUBMITTED: "corporate_application_submitted",

  // --- UI etkileşim ---
  BANNER_CLICKED: "banner_clicked",
  CAMPAIGN_PACKAGE_VIEWED: "campaign_package_viewed",
  HERO_SLIDE_CLICKED: "hero_slide_clicked",
  BLOG_POST_VIEWED: "blog_post_viewed",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export const ALL_EVENT_NAMES: EventName[] = Object.values(EVENTS) as EventName[];

// Property contract'ları — her event için beklenen properties
export interface ProductViewedProps {
  productId: string;
  productSlug: string;
  productName: string;
  categoryId?: string;
  price?: number;
}

export interface CartItemAddedProps {
  productId: string;
  productSlug: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  cartId?: string;
}

export interface CartItemRemovedProps {
  productId: string;
  cartId?: string;
  quantity?: number;
}

export interface CartItemQuantityChangedProps {
  productId: string;
  cartId?: string;
  previousQuantity: number;
  newQuantity: number;
}

export interface CheckoutStartedProps {
  cartId?: string;
  itemCount: number;
  cartTotal: number;
}

export interface CheckoutStepCompletedProps {
  step: "address" | "shipping" | "payment_method" | "review";
  stepIndex: number;
}

export interface CouponAppliedProps {
  couponCode: string;
  discountAmount: number;
  couponType: string;
}

export interface CouponRejectedProps {
  couponCode: string;
  reason: string;
}

export interface PaymentSucceededProps {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
}

export interface PaymentFailedProps {
  orderId?: string;
  reason: string;
  errorCode?: string;
}

export interface OrderPlacedProps {
  orderId: string;
  orderNumber: string;
  total: number;
  itemCount: number;
  hasDesignSupport: boolean;
}

export interface OrderStatusChangedProps {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
}

export interface ProductSearchedProps {
  query: string;
  resultCount: number;
}

export interface BannerClickedProps {
  bannerId: string;
  bannerTitle: string;
  location: string;
  ctaHref?: string;
}

export interface UserRegisteredProps {
  accountType: "individual" | "corporate";
  referrerSource?: string;
}

export interface BlogPostViewedProps {
  postId: string;
  postSlug: string;
  categoryId?: string;
  readingTimeSeconds?: number;
}

// Discriminated union — tip-güvenli event tracking için
export type TrackableEvent =
  | { name: typeof EVENTS.PRODUCT_VIEWED; properties: ProductViewedProps }
  | { name: typeof EVENTS.PRODUCT_LIST_VIEWED; properties: { categoryId?: string; productCount: number } }
  | { name: typeof EVENTS.PRODUCT_SEARCHED; properties: ProductSearchedProps }
  | { name: typeof EVENTS.CATEGORY_VIEWED; properties: { categoryId: string; categorySlug: string } }
  | { name: typeof EVENTS.CART_ITEM_ADDED; properties: CartItemAddedProps }
  | { name: typeof EVENTS.CART_ITEM_REMOVED; properties: CartItemRemovedProps }
  | { name: typeof EVENTS.CART_ITEM_QUANTITY_CHANGED; properties: CartItemQuantityChangedProps }
  | { name: typeof EVENTS.CART_VIEWED; properties: { cartId?: string; itemCount: number; cartTotal: number } }
  | { name: typeof EVENTS.CART_ABANDONED; properties: { cartId: string; itemCount: number; cartTotal: number; minutesSinceLastUpdate: number } }
  | { name: typeof EVENTS.CHECKOUT_STARTED; properties: CheckoutStartedProps }
  | { name: typeof EVENTS.CHECKOUT_STEP_COMPLETED; properties: CheckoutStepCompletedProps }
  | { name: typeof EVENTS.COUPON_APPLIED; properties: CouponAppliedProps }
  | { name: typeof EVENTS.COUPON_REJECTED; properties: CouponRejectedProps }
  | { name: typeof EVENTS.PAYMENT_INITIATED; properties: { cartTotal: number; paymentMethod: string } }
  | { name: typeof EVENTS.PAYMENT_SUCCEEDED; properties: PaymentSucceededProps }
  | { name: typeof EVENTS.PAYMENT_FAILED; properties: PaymentFailedProps }
  | { name: typeof EVENTS.ORDER_PLACED; properties: OrderPlacedProps }
  | { name: typeof EVENTS.ORDER_STATUS_CHANGED; properties: OrderStatusChangedProps }
  | { name: typeof EVENTS.DESIGN_UPLOAD_STARTED; properties: { orderId: string } }
  | { name: typeof EVENTS.DESIGN_UPLOAD_COMPLETED; properties: { orderId: string; fileName: string; fileSizeBytes: number } }
  | { name: typeof EVENTS.USER_REGISTERED; properties: UserRegisteredProps }
  | { name: typeof EVENTS.USER_LOGGED_IN; properties: { accountType: string } }
  | { name: typeof EVENTS.USER_LOGGED_OUT; properties: Record<string, never> }
  | { name: typeof EVENTS.CORPORATE_APPLICATION_SUBMITTED; properties: { applicationId: string } }
  | { name: typeof EVENTS.BANNER_CLICKED; properties: BannerClickedProps }
  | { name: typeof EVENTS.CAMPAIGN_PACKAGE_VIEWED; properties: { packageId: string; packageSlug: string } }
  | { name: typeof EVENTS.HERO_SLIDE_CLICKED; properties: { slideId: string; ctaHref?: string } }
  | { name: typeof EVENTS.BLOG_POST_VIEWED; properties: BlogPostViewedProps };
