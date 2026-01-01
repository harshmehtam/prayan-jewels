import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Product model for silver mangalsutra catalog
  Product: a
    .model({
      name: a.string().required(),
      description: a.string().required(),
      price: a.float().required(),
      images: a.string().array().required(),
      category: a.enum(['traditional', 'modern', 'designer']),
      material: a.string().default('silver'),
      weight: a.float(), // in grams
      length: a.float(), // in inches
      style: a.string(),
      occasion: a.string().array(),
      metaTitle: a.string(),
      metaDescription: a.string(),
      keywords: a.string().array(),
      isActive: a.boolean().default(true),
      inventory: a.hasOne('InventoryItem', 'productId'),
      cartItems: a.hasMany('CartItem', 'productId'),
      orderItems: a.hasMany('OrderItem', 'productId'),
      wishlistItems: a.hasMany('Wishlist', 'productId'),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // Inventory tracking for products
  InventoryItem: a
    .model({
      productId: a.id().required(),
      stockQuantity: a.integer().required(),
      reservedQuantity: a.integer().default(0),
      reorderPoint: a.integer().default(5),
      supplierName: a.string(),
      supplierContact: a.string(),
      leadTime: a.integer(), // in days
      lastRestocked: a.datetime(),
      product: a.belongsTo('Product', 'productId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // User profile extension
  UserProfile: a
    .model({
      userId: a.id().required(),
      firstName: a.string(),
      lastName: a.string(),
      phone: a.string(),
      dateOfBirth: a.date(),
      newsletter: a.boolean().default(false),
      smsUpdates: a.boolean().default(false),
      preferredCategories: a.string().array(),
      role: a.enum(['customer', 'admin', 'super_admin']),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.group('admin').to(['read', 'update']),
    ]),

  // Address management
  Address: a
    .model({
      userId: a.id().required(),
      type: a.enum(['shipping', 'billing']),
      firstName: a.string().required(),
      lastName: a.string().required(),
      addressLine1: a.string().required(),
      addressLine2: a.string(),
      city: a.string().required(),
      state: a.string().required(),
      postalCode: a.string().required(),
      country: a.string().required(),
      isDefault: a.boolean().default(false),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.group('admin').to(['read']),
    ]),

  // Shopping cart for customers
  ShoppingCart: a
    .model({
      customerId: a.id(),
      sessionId: a.string(),
      subtotal: a.float().default(0),
      estimatedTax: a.float().default(0),
      estimatedShipping: a.float().default(0),
      estimatedTotal: a.float().default(0),
      expiresAt: a.datetime(),
      items: a.hasMany('CartItem', 'cartId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['create', 'read', 'update', 'delete']),
    ]),

  // Cart items
  CartItem: a
    .model({
      cartId: a.id().required(),
      productId: a.id().required(),
      quantity: a.integer().required(),
      unitPrice: a.float().required(),
      totalPrice: a.float().required(),
      cart: a.belongsTo('ShoppingCart', 'cartId'),
      product: a.belongsTo('Product', 'productId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['create', 'read', 'update', 'delete']),
    ]),

  // Order management
  Order: a
    .model({
      customerId: a.id().required(),
      subtotal: a.float().required(),
      tax: a.float().default(0),
      shipping: a.float().default(0),
      totalAmount: a.float().required(),
      status: a.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
      confirmationNumber: a.string(), // Unique order confirmation number
      paymentOrderId: a.string(), // Razorpay order ID
      trackingNumber: a.string(),
      estimatedDelivery: a.date(),
      shippingFirstName: a.string().required(),
      shippingLastName: a.string().required(),
      shippingAddressLine1: a.string().required(),
      shippingAddressLine2: a.string(),
      shippingCity: a.string().required(),
      shippingState: a.string().required(),
      shippingPostalCode: a.string().required(),
      shippingCountry: a.string().required(),
      billingFirstName: a.string().required(),
      billingLastName: a.string().required(),
      billingAddressLine1: a.string().required(),
      billingAddressLine2: a.string(),
      billingCity: a.string().required(),
      billingState: a.string().required(),
      billingPostalCode: a.string().required(),
      billingCountry: a.string().required(),
      items: a.hasMany('OrderItem', 'orderId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // Wishlist for customer product saving
  Wishlist: a
    .model({
      customerId: a.id().required(),
      productId: a.id().required(),
      product: a.belongsTo('Product', 'productId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'delete']),
    ]),
  // Order items
  OrderItem: a
    .model({
      orderId: a.id().required(),
      productId: a.id().required(),
      productName: a.string().required(),
      quantity: a.integer().required(),
      unitPrice: a.float().required(),
      totalPrice: a.float().required(),
      order: a.belongsTo('Order', 'orderId'),
      product: a.belongsTo('Product', 'productId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // Audit log for tracking admin actions and security events
  AuditLog: a
    .model({
      adminId: a.id().required(), // ID of the admin who performed the action
      adminEmail: a.string(), // Email of the admin for easier identification
      targetUserId: a.id(), // ID of the user being acted upon (optional)
      targetUserEmail: a.string(), // Email of the target user (optional)
      action: a.enum(['user_created', 'user_updated', 'user_deleted', 'role_changed', 'password_reset', 'product_created', 'product_updated', 'product_deleted', 'order_updated', 'inventory_updated', 'login_attempt', 'login_success', 'login_failure', 'permission_denied', 'data_export', 'bulk_operation', 'system_config_changed', 'security_alert']),
      resource: a.enum(['user', 'product', 'order', 'inventory', 'system', 'auth']), // What type of resource was affected
      resourceId: a.string(), // ID of the specific resource (product ID, order ID, etc.)
      description: a.string().required(), // Human-readable description of the action
      ipAddress: a.string(), // IP address of the admin
      userAgent: a.string(), // Browser/client information
      sessionId: a.string(), // Session identifier for tracking
      severity: a.enum(['low', 'medium', 'high', 'critical']), // Severity level for security monitoring
      metadata: a.json(), // Additional structured data about the action
      success: a.boolean().default(true), // Whether the action was successful
      errorMessage: a.string(), // Error message if action failed
    })
    .authorization((allow) => [
      allow.group('admin').to(['create', 'read']),
      allow.group('super_admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // Security events for monitoring suspicious activities
  SecurityEvent: a
    .model({
      eventType: a.enum(['failed_login_attempts', 'suspicious_activity', 'privilege_escalation', 'data_breach_attempt', 'unauthorized_access', 'account_lockout', 'password_policy_violation', 'session_hijacking', 'brute_force_attack']),
      userId: a.id(), // User involved in the security event
      adminId: a.id(), // Admin involved (if applicable)
      severity: a.enum(['low', 'medium', 'high', 'critical']),
      description: a.string().required(),
      ipAddress: a.string(),
      userAgent: a.string(),
      location: a.string(), // Geographic location if available
      resolved: a.boolean().default(false),
      resolvedBy: a.id(), // Admin who resolved the issue
      resolvedAt: a.datetime(),
      resolutionNotes: a.string(),
      metadata: a.json(), // Additional event-specific data
    })
    .authorization((allow) => [
      allow.group('admin').to(['create', 'read', 'update']),
      allow.group('super_admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // Admin session tracking for accountability
  AdminSession: a
    .model({
      adminId: a.id().required(),
      adminEmail: a.string(),
      sessionId: a.string().required(),
      ipAddress: a.string(),
      userAgent: a.string(),
      location: a.string(),
      loginTime: a.datetime().required(),
      logoutTime: a.datetime(),
      lastActivity: a.datetime(),
      isActive: a.boolean().default(true),
      actionsPerformed: a.integer().default(0), // Count of actions in this session
      metadata: a.json(),
    })
    .authorization((allow) => [
      allow.group('admin').to(['create', 'read', 'update']),
      allow.group('super_admin').to(['create', 'read', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
