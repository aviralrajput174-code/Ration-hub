const $ = (id) => document.getElementById(id);
const STORE_KEY = "rationHubDemoV1";

const defaultProducts = [
 {id:"seed1",name:"Premium Basmati Rice",price:78,unit:"1 kg",category:"Grains",emoji:"🍚",shop:"Ration Hub Local Store"},
 {id:"seed2",name:"Whole Wheat Atta",price:42,unit:"1 kg",category:"Grains",emoji:"🌾",shop:"Ration Hub Local Store"},
 {id:"seed3",name:"Fresh Milk",price:30,unit:"500 ml",category:"Dairy",emoji:"🥛",shop:"Ration Hub Local Store"},
 {id:"seed4",name:"Potatoes",price:28,unit:"1 kg",category:"Vegetables",emoji:"🥔",shop:"Ration Hub Local Store"},
 {id:"seed5",name:"Tomatoes",price:32,unit:"1 kg",category:"Vegetables",emoji:"🍅",shop:"Ration Hub Local Store"},
 {id:"seed6",name:"Cooking Oil",price:135,unit:"1 L",category:"Grocery",emoji:"🫗",shop:"Ration Hub Local Store"},
 {id:"seed7",name:"Tea Biscuits",price:20,unit:"Pack",category:"Snacks",emoji:"🍪",shop:"Ration Hub Local Store"},
 {id:"seed8",name:"Dishwashing Bar",price:15,unit:"Piece",category:"Household",emoji:"🧼",shop:"Ration Hub Local Store"}
];

let state = loadState();
let selectedCategory = "All";
let searchTerm = "";
let draftProducts = [];
let listImageData = "";
let ocrText = "";
let verifiedPhone = false;
let orderFilter = "all";

function loadState() {
 try {
  const s = JSON.parse(localStorage.getItem(STORE_KEY));
  if (s) return {
   products: defaultProducts,
   cart: [],
   orders: [],
   shop: null,
   deliveryPartners: [],
   notifications: [],
   customer: null,
   ...s
  };
 } catch (e) {}
 return {
  products: defaultProducts,
  cart: [],
  orders: [],
  shop: null,
  deliveryPartners: [],
  notifications: [],
  customer: null
 };
}

function saveState() {
 localStorage.setItem(STORE_KEY, JSON.stringify(state));
 renderAll();
}

function escapeHTML(s) {
 return String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
 }[c]));
}

function money(n) {
 return "₹" + Number(n || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 2
 });
}

function toast(msg) {
 const t = $("toast");
 if (!t) {
  alert(msg);
  return;
 }
 t.textContent = msg;
 t.classList.add("show");
 clearTimeout(toast.timer);
 toast.timer = setTimeout(() => t.classList.remove("show"), 2800);
}

function showView(view) {
 document.querySelectorAll(".view").forEach(v => {
  v.classList.toggle("active", v.id === "view-" + view);
 });

 document.querySelectorAll(".nav-btn").forEach(b => {
  b.classList.toggle("active", b.dataset.view === view);
 });

 if (view === "cart") renderCart();
 if (view === "orders") renderCustomerOrders();
 if (view === "shopkeeper") renderShopOrders();
 if (view === "delivery") renderDeliveryOrders();
 if (view === "notifications") renderNotifications();

 window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-btn").forEach(b => {
 b.addEventListener("click", () => showView(b.dataset.view));
});

document.querySelectorAll("[data-goto]").forEach(b => {
 b.addEventListener("click", () => showView(b.dataset.goto));
});

$("shopNow")?.addEventListener("click", () => {
 $("productGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

$("addressShortcut")?.addEventListener("click", () => {
 showView("cart");
 $("customerAddress")?.focus();
});

$("notificationsShortcut")?.addEventListener("click", () => {
 showView("notifications");
});

$("searchInput")?.addEventListener("input", e => {
 searchTerm = e.target.value.trim().toLowerCase();
 renderProducts();
});

$("clearSearch")?.addEventListener("click", () => {
 $("searchInput").value = "";
 searchTerm = "";
 renderProducts();
});

document.querySelectorAll(".category").forEach(b => {
 b.addEventListener("click", () => {
  selectedCategory = b.dataset.category;
  document.querySelectorAll(".category").forEach(x => {
   x.classList.toggle("active", x === b);
  });
  renderProducts();
 });
});

function productEmoji(p) {
 return p.emoji || (
  /milk|dairy|curd|yogurt/i.test(p.name) ? "🥛" :
  /rice|atta|flour|grain|wheat|dal|lentil/i.test(p.name) ? "🌾" :
  /tomato/i.test(p.name) ? "🍅" :
  /potato/i.test(p.name) ? "🥔" :
  /onion/i.test(p.name) ? "🧅" :
  /oil/i.test(p.name) ? "🫗" :
  /soap|clean|detergent/i.test(p.name) ? "🧼" :
  /biscuit|snack|chips/i.test(p.name) ? "🍪" :
  /vegetable|spinach|cabbage|cauliflower/i.test(p.name) ? "🥦" : "🛍️"
 );
}

function photoMarkup(p, cls = "product-photo") {
 return p.photo
  ? `<div class="${cls}"><img src="${p.photo}" alt="${escapeHTML(p.name)}"></div>`
  : `<div class="${cls}"><span class="product-emoji">${productEmoji(p)}</span></div>`;
}

function renderProducts() {
 const products = state.products.filter(p =>
  (selectedCategory === "All" ||
   p.category === selectedCategory ||
   (selectedCategory === "Grains" && /grocery/i.test(p.category))) &&
  (!searchTerm ||
   `${p.name} ${p.category} ${p.shop || ""}`.toLowerCase().includes(searchTerm))
 );

 if (!$("productCount") || !$("productGrid")) return;

 $("productCount").textContent =
  `${products.length} product${products.length === 1 ? "" : "s"}`;

 $("productGrid").innerHTML = products.map(p => `
  <article class="product-card">
   ${photoMarkup(p)}
   <div class="product-info">
    <h3>${escapeHTML(p.name)}</h3>
    <p class="shop-line">
     🏪 ${escapeHTML(p.shop || state.shop?.name || "Local store")}
     · ${escapeHTML(p.unit || "1 item")}
    </p>
    <div class="product-bottom">
     <span class="price">
      ${money(p.price)}
      <small>/${escapeHTML(p.unit || "item")}</small>
     </span>
     <button class="add-btn" data-add="${escapeHTML(p.id)}">+ Add</button>
    </div>
   </div>
  </article>
 `).join("");

 $("emptyProducts")?.classList.toggle("hidden", products.length > 0);

 $("productGrid").querySelectorAll("[data-add]").forEach(b => {
  b.addEventListener("click", () => addToCart(b.dataset.add));
 });
}

function addToCart(id) {
 const p = state.products.find(x => x.id === id);
 if (!p) return;

 const found = state.cart.find(x => x.productId === id);

 if (found) found.qty++;
 else state.cart.push({ productId: id, qty: 1 });

 saveState();
 toast(`${p.name} added to cart`);
}

function cartDetails() {
 return state.cart.map(c => ({
  ...c,
  product: state.products.find(p => p.id === c.productId)
 })).filter(c => c.product);
}

function cartSubtotal() {
 return cartDetails().reduce((sum, c) => sum + c.product.price * c.qty, 0);
}

function renderCart() {
 if (!$("cartItems")) return;

 const items = cartDetails();

 $("cartItems").innerHTML = items.length
  ? items.map(c => `
   <div class="cart-row">
    <div class="cart-thumb">
     ${c.product.photo
      ? `<img src="${c.product.photo}" alt="">`
      : productEmoji(c.product)}
    </div>
    <div>
     <h3>${escapeHTML(c.product.name)}</h3>
     <p>${money(c.product.price)} / ${escapeHTML(c.product.unit || "item")}</p>
     <div class="quantity">
      <button data-qty="${c.productId}" data-delta="-1">−</button>
      <b>${c.qty}</b>
      <button data-qty="${c.productId}" data-delta="1">+</button>
     </div>
    </div>
    <div class="cart-price">
     ${money(c.product.price * c.qty)}
     <br>
     <button class="small-btn red" data-remove="${c.productId}" style="margin-top:8px">
      Remove
     </button>
    </div>
   </div>
  `).join("")
  : `<div class="no-orders">
      🛒<br><br>Your cart is empty.<br>
      <button class="secondary-btn" data-back-shop style="margin-top:12px">
       Browse products
      </button>
     </div>`;

 $("cartItems").querySelectorAll("[data-qty]").forEach(b => {
  b.addEventListener("click", () => {
   const item = state.cart.find(c => c.productId === b.dataset.qty);
   if (!item) return;

   item.qty += Number(b.dataset.delta);
   if (item.qty <= 0) {
    state.cart = state.cart.filter(c => c !== item);
   }
   saveState();
  });
 });

 $("cartItems").querySelectorAll("[data-remove]").forEach(b => {
  b.addEventListener("click", () => {
   state.cart = state.cart.filter(c => c.productId !== b.dataset.remove);
   saveState();
  });
 });

 const back = $("cartItems").querySelector("[data-back-shop]");
 if (back) back.addEventListener("click", () => showView("customer"));

 const subtotal = cartSubtotal();
 const fee = items.length ? (subtotal >= 499 ? 0 : 20) : 0;

 if ($("cartSubtotal")) $("cartSubtotal").textContent = money(subtotal);
 if ($("deliveryFee")) $("deliveryFee").textContent = money(fee);
 if ($("cartTotal")) $("cartTotal").textContent = money(subtotal + fee);

 if ($("cartCount")) {
  $("cartCount").textContent = state.cart.reduce((n, c) => n + c.qty, 0);
 }

 if ($("placeOrderBtn")) {
  $("placeOrderBtn").disabled = !items.length;
  $("placeOrderBtn").style.opacity = items.length ? 1 : .55;
 }
}

if ($("verifyPhoneBtn")) {
 $("verifyPhoneBtn").addEventListener("click", () => {
  const phone = $("customerPhone").value.trim();

  if (!/^[0-9]{10}$/.test(phone)) {
   toast("Enter a valid 10-digit mobile number first.");
   return;
  }

  verifiedPhone = true;
  $("verifyStatus").textContent = "✓ Demo verified";
  $("verifyStatus").style.color = "#176b4d";
  toast("Demo verification complete. No OTP was sent.");
 });
}

$("customerPhone")?.addEventListener("input", () => {
 verifiedPhone = false;
 if ($("verifyStatus")) {
  $("verifyStatus").textContent = "Not verified";
  $("verifyStatus").style.color = "";
 }
});

$("checkoutForm")?.addEventListener("submit", e => {
 e.preventDefault();

 const items = cartDetails();
 if (!items.length) {
  toast("Your cart is empty.");
  return;
 }

 if (!verifiedPhone) {
  toast("Please use Verify number (demo) first.");
  return;
 }

 const name = $("customerName").value.trim();
 const phone = $("customerPhone").value.trim();
 const address = $("customerAddress").value.trim();

 const subtotal = cartSubtotal();
 const fee = subtotal >= 499 ? 0 : 20;

 const order = {
  id: "RH" + Date.now().toString().slice(-7),
  name,
  phone,
  address,
  items: items.map(c => ({
   productId: c.productId,
   name: c.product.name,
   price: c.product.price,
   qty: c.qty,
   shop: c.product.shop || state.shop?.name || "Local store"
  })),
  subtotal,
  fee,
  total: subtotal + fee,
  payment: "Cash on Delivery",
  status: "Placed",
  createdAt: new Date().toISOString()
 };

 state.orders.unshift(order);
 state.cart = [];
 state.customer = { name, phone, address };

 state.notifications.unshift({
  id: Date.now(),
  title: "New order placed",
  message: `Order ${order.id} placed for ${money(order.total)}.`,
  createdAt: new Date().toISOString(),
  orderId: order.id
 });

 saveState();
 verifiedPhone = false;

 if ($("verifyStatus")) $("verifyStatus").textContent = "Not verified";

 toast(`Order ${order.id} placed successfully! COD selected.`);
 showView("orders");
});

$("shopForm")?.addEventListener("submit", e => {
 e.preventDefault();

 state.shop = {
  name: $("shopName").value.trim(),
  owner: $("ownerName").value.trim(),
  phone: $("shopPhone").value.trim(),
  address: $("shopAddress").value.trim(),
  category: $("shopCategory").value
 };

 saveState();
 toast("Shop profile saved on this device.");
});

function fillShopForm() {
 if (!state.shop) return;

 if ($("shopName")) $("shopName").value = state.shop.name || "";
 if ($("ownerName")) $("ownerName").value = state.shop.owner || "";
 if ($("shopPhone")) $("shopPhone").value = state.shop.phone || "";
 if ($("shopAddress")) $("shopAddress").value = state.shop.address || "";
 if ($("shopCategory")) $("shopCategory").value = state.shop.category || "Grocery";
}

function inferCategory(name) {
 const n = name.toLowerCase();

 if (/milk|curd|paneer|cheese|butter|yogurt/.test(n)) return "Dairy";
 if (/tomato|potato|onion|spinach|cabbage|carrot|vegetable|chilli|chili|cauliflower|peas/.test(n)) return "Vegetables";
 if (/biscuit|chips|snack|chocolate|namkeen|cookie/.test(n)) return "Snacks";
 if (/soap|detergent|cleaner|broom|dishwash|cleaning/.test(n)) return "Household";
 if (/rice|atta|flour|grain|wheat|dal|lentil|oil|sugar|salt|masala|spice/.test(n)) return "Grains";

 return "Grocery";
}

function parseLines(text) {
 return text.split(/\n/)
  .map(line => line.trim())
  .filter(Boolean)
  .map(line => {
   const match = line.match(/^(.+?)[\s,;:=\-]+(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)\s*$/i);
   if (!match) return null;

   const name = match[1].replace(/^[\d.)\s]+/, "").trim();
   const price = Number(match[2]);

   if (!name || !Number.isFinite(price)) return null;

   return {
    name,
    price,
    category: inferCategory(name),
    unit: "item",
    emoji: "",
    photo: ""
   };
  })
  .filter(Boolean);
}

function setDrafts(products) {
 draftProducts = products;
 renderDrafts();
}

function renderDrafts() {
 const tbody = $("draftRows");
 if (!tbody) return;

 tbody.innerHTML = draftProducts.map((p, i) => `
  <tr>
   <td>
    <input data-draft-name="${i}" value="${escapeHTML(p.name)}" aria-label="Product name">
   </td>
   <td>
    <input data-draft-price="${i}" type="number" min="0" step="0.01" value="${Number(p.price) || 0}" aria-label="Price">
   </td>
   <td>
    <select data-draft-cat="${i}">
     ${["Grains","Dairy","Vegetables","Snacks","Household","Grocery"].map(c =>
      `<option ${p.category === c ? "selected" : ""}>${c}</option>`
     ).join("")}
    </select>
   </td>
   <td>
    <label class="small-upload">
     Add photo
     <input type="file" accept="image/*" data-draft-photo="${i}">
    </label>
    ${p.photo ? "<span> ✓</span>" : ""}
   </td>
   <td><button class="remove-draft" data-delete-draft="${i}">×</button></td>
  </tr>
 `).join("");

 tbody.querySelectorAll("[data-draft-name]").forEach(el => {
  el.addEventListener("change", () => {
   draftProducts[+el.dataset.draftName].name = el.value.trim();
  });
 });

 tbody.querySelectorAll("[data-draft-price]").forEach(el => {
  el.addEventListener("change", () => {
   draftProducts[+el.dataset.draftPrice].price = Number(el.value);
  });
 });

 tbody.querySelectorAll("[data-draft-cat]").forEach(el => {
  el.addEventListener("change", () => {
   draftProducts[+el.dataset.draftCat].category = el.value;
  });
 });

 tbody.querySelectorAll("[data-delete-draft]").forEach(el => {
  el.addEventListener("click", () => {
   draftProducts.splice(+el.dataset.deleteDraft, 1);
   renderDrafts();
  });
 });

 tbody.querySelectorAll("[data-draft-photo]").forEach(el => {
  el.addEventListener("change", async () => {
   const file = el.files[0];
   if (!file) return;

   try {
    draftProducts[+el.dataset.draftPhoto].photo = await resizeImage(file, 600);
    renderDrafts();
   } catch (e) {
    toast("Could not load that photo.");
   }
  });
 });

 if ($("draftSummary")) {
  $("draftSummary").textContent =
   `${draftProducts.length} product${draftProducts.length === 1 ? "" : "s"} ready to review`;
 }
}

$("publishBtn")?.addEventListener("click", () => {
 if (!draftProducts.length) {
  toast("Add or scan products first.");
  return;
 }

 if (!state.shop) {
  toast("Please save your shop profile before publishing.");
  $("shopName")?.focus();
  return;
 }

 const valid = draftProducts.filter(p =>
  p.name && Number.isFinite(Number(p.price)) && Number(p.price) >= 0
 );

 if (!valid.length) {
  toast("Check product names and prices.");
  return;
 }

 valid.forEach(p => {
  state.products.unshift({
   ...p,
   id: "p" + Date.now() + Math.random().toString(16).slice(2),
   shop: state.shop.name,
   unit: p.unit || "item"
  });
 });

 state.notifications.unshift({
  id: Date.now(),
  title: "Products published",
  message: `${valid.length} products added by ${state.shop.name}.`,
  createdAt: new Date().toISOString()
 });

 draftProducts = [];
 saveState();
 renderDrafts();
 toast(`${valid.length} product(s) published to customer catalogue.`);
});

async function resizeImage(file, max = 900) {
 return new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onerror = reject;

  reader.onload = () => {
   const img = new Image();
   img.onerror = reject;

   img.onload = () => {
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");

    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);

    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    resolve(c.toDataURL("image/jpeg", .78));
   };

   img.src = reader.result;
  };

  reader.readAsDataURL(file);
 });
}

async function chooseListImage(file) {
 if (!file) return;

 try {
  listImageData = await resizeImage(file, 1100);

  $("ocrImage").src = listImageData;
  $("ocrPreview").classList.remove("hidden");
  $("ocrStatus").textContent = file.name;
  $("ocrHelp").textContent = "Image ready. Press Generate product list to run text recognition.";
  $("generateBtn").disabled = false;

  ocrText = "";
 } catch (e) {
  toast("Could not open image.");
 }
}

$("cameraInput")?.addEventListener("change", e => chooseListImage(e.target.files[0]));
$("listImageInput")?.addEventListener("change", e => chooseListImage(e.target.files[0]));

$("generateBtn")?.addEventListener("click", async () => {
 if (!listImageData) return;

 if (!window.Tesseract) {
  toast("OCR library did not load. Type or paste the list manually.");
  return;
 }

 $("generateBtn").disabled = true;
 $("ocrProgressTrack")?.classList.remove("hidden");
 $("ocrStatus").textContent = "Reading image…";
 $("ocrHelp").textContent = "Keep this page open while text is recognized.";

 try {
  const result = await Tesseract.recognize(listImageData, "eng", {
   logger: m => {
    if (m.status === "recognizing text") {
     $("ocrProgress").style.width = Math.round((m.progress || 0) * 100) + "%";
    }
   }
  });

  ocrText = result.data.text || "";
  $("bulkText").value = ocrText;

  const drafts = parseLines(ocrText);

  $("ocrStatus").textContent = "Scan complete";
  $("ocrHelp").textContent =
   `Recognized text. ${drafts.length} possible product rows found. Please verify names and prices.`;

  if (drafts.length) {
   setDrafts(drafts);
  } else {
   toast("Text was read, but product-price pairs were not clear. Edit the text box into 'Rice, 55' format and prepare again.");
  }
 } catch (err) {
  console.error(err);
  $("ocrStatus").textContent = "Scan failed";
  $("ocrHelp").textContent = "Try a clearer photo or type the list manually.";
  toast("OCR could not read this image. Try a clearer photo.");
 } finally {
  $("generateBtn").disabled = false;
 }
});

$("deliveryForm")?.addEventListener("submit", e => {
 e.preventDefault();

 const partner = {
  id: "DP" + Date.now().toString().slice(-6),
  name: $("deliveryName").value.trim(),
  phone: $("deliveryPhone").value.trim(),
  area: $("deliveryArea").value.trim(),
  vehicle: $("deliveryVehicle").value,
  availability: $("deliveryAvailability").value,
  createdAt: new Date().toISOString()
 };

 state.deliveryPartners.push(partner);

 state.notifications.unshift({
  id: Date.now(),
  title: "Delivery partner application",
  message: `${partner.name} registered for ${partner.area}.`,
  createdAt: new Date().toISOString()
 });

 saveState();

 $("deliverySuccess").classList.remove("hidden");
 $("deliverySuccess").innerHTML =
  `<b>Application saved in demo mode.</b><br>
   Partner ID: ${escapeHTML(partner.id)}<br>
   Area: ${escapeHTML(partner.area)}<br>
   This is not yet sent to a real administrator.`;

 toast("Delivery partner profile created.");
});

function statusClass(status) {
 return status === "Cancelled" ? "cancelled" :
  status === "Delivered" ? "delivered" : "";
}

function orderCard(o, mode = "customer") {
 const items = o.items.map(i => `${escapeHTML(i.name)} × ${i.qty}`).join(", ");
 let actions = "";

 if (mode === "customer" && ["Placed","Accepted","Preparing"].includes(o.status)) {
  actions = `<button class="small-btn red" data-cancel="${o.id}">Cancel order</button>`;
 }

 if (mode === "shop" && o.status === "Placed") {
  actions = `
   <button class="small-btn green" data-status="${o.id}" data-next="Accepted">Accept order</button>
   <button class="small-btn red" data-cancel="${o.id}">Cancel</button>`;
 }

 if (mode === "shop" && o.status === "Accepted") {
  actions = `<button class="small-btn green" data-status="${o.id}" data-next="Preparing">Mark preparing</button>`;
 }

 if (mode === "delivery" && ["Accepted","Preparing","Out for delivery"].includes(o.status)) {
  actions = `
   <button class="small-btn green" data-status="${o.id}" data-next="${
    o.status === "Out for delivery" ? "Delivered" :
    o.status === "Preparing" ? "Out for delivery" : "Preparing"
   }">${
    o.status === "Out for delivery" ? "Mark delivered" :
    o.status === "Preparing" ? "Start delivery" : "Accept for delivery"
   }</button>`;
 }

 return `
  <article class="order-card">
   <div>
    <h3>
     Order ${escapeHTML(o.id)}
     <span class="order-status ${statusClass(o.status)}">${escapeHTML(o.status)}</span>
    </h3>
    <p>🕒 ${new Date(o.createdAt).toLocaleString()} · 💵 ${escapeHTML(o.payment)}</p>
    <p><b>${escapeHTML(o.name)}</b> · ${escapeHTML(o.phone)}</p>
    <p>📍 ${escapeHTML(o.address)}</p>
    <p>${items}</p>
    <div class="order-actions">${actions}</div>
   </div>
   <div>
    <div class="order-total">${money(o.total)}</div>
    <p class="muted">${o.items.length} line item(s)</p>
   </div>
  </article>`;
}

function bindOrderActions(container) {
 container.querySelectorAll("[data-cancel]").forEach(b => {
  b.addEventListener("click", () => {
   const o = state.orders.find(x => x.id === b.dataset.cancel);
   if (!o) return;

   if (!["Placed","Accepted","Preparing"].includes(o.status)) {
    toast("This order can no longer be cancelled in the demo.");
    return;
   }

   o.status = "Cancelled";

   state.notifications.unshift({
    id: Date.now(),
    title: "Order cancelled",
    message: `Order ${o.id} was cancelled.`,
    createdAt: new Date().toISOString(),
    orderId: o.id
   });

   saveState();
   toast("Order cancelled.");
  });
 });

 container.querySelectorAll("[data-status]").forEach(b => {
  b.addEventListener("click", () => {
   const o = state.orders.find(x => x.id === b.dataset.status);
   if (!o) return;

   o.status = b.dataset.next;

   state.notifications.unshift({
    id: Date.now(),
    title: "Order status updated",
    message: `Order ${o.id}: ${o.status}.`,
    createdAt: new Date().toISOString(),
    orderId: o.id
   });

   saveState();
   toast(`Order updated: ${o.status}`);
  });
 });
}

function renderCustomerOrders() {
 let list = state.orders;

 if (orderFilter === "active") {
  list = list.filter(o => !["Cancelled","Delivered"].includes(o.status));
 }

 if (orderFilter === "cancelled") {
  list = list.filter(o => o.status === "Cancelled");
 }

 if (!$("customerOrders")) return;

 $("customerOrders").innerHTML = list.length
  ? list.map(o => orderCard(o, "customer")).join("")
  : `<div class="no-orders">📦<br><br>No orders here yet. Add products to your cart and place an order.</div>`;

 bindOrderActions($("customerOrders"));
}

function renderShopOrders() {
 if (!$("shopOrders")) return;

 const list = state.orders;

 $("shopOrders").innerHTML = list.length
  ? list.map(o => orderCard(o, "shop")).join("")
  : `<div class="no-orders">No incoming orders yet.</div>`;

 bindOrderActions($("shopOrders"));
}

function renderDeliveryOrders() {
 if (!$("deliveryOrders")) return;

 const list = state.orders.filter(o => !["Cancelled","Delivered"].includes(o.status));

 $("deliveryOrders").innerHTML = list.length
  ? list.map(o => orderCard(o, "delivery")).join("")
  : `<div class="no-orders">No active delivery orders right now.</div>`;

 bindOrderActions($("deliveryOrders"));
}

function renderNotifications() {
 if (!$("notificationsList")) return;

 $("notificationsList").innerHTML = state.notifications.length
  ? state.notifications.map(n => `
   <article class="order-card">
    <div>
     <h3>🔔 ${escapeHTML(n.title)}</h3>
     <p>${escapeHTML(n.message)}</p>
     <p>${new Date(n.createdAt).toLocaleString()}</p>
    </div>
   </article>
  `).join("")
  : `<div class="no-orders">No notifications yet.</div>`;
}

document.querySelectorAll("[data-order-filter]").forEach(b => {
 b.addEventListener("click", () => {
  orderFilter = b.dataset.orderFilter;

  document.querySelectorAll("[data-order-filter]").forEach(x => {
   x.classList.toggle("active", x === b);
  });

  renderCustomerOrders();
 });
});

function renderAll() {
 renderProducts();
 renderCart();
 renderCustomerOrders();
 renderShopOrders();
 renderDeliveryOrders();
 renderNotifications();

 if ($("statProducts")) $("statProducts").textContent = state.products.length;

 if ($("statOrders")) {
  $("statOrders").textContent =
   state.orders.filter(o => !["Cancelled","Delivered"].includes(o.status)).length;
 }

 if ($("shopStatus")) $("shopStatus").textContent = state.shop ? "Active" : "Not set up";

 if ($("headerAddress")) {
  $("headerAddress").textContent = state.customer?.address
   ? state.customer.address.split(",")[0]
   : "Set delivery address";
 }

 if ($("notificationCount")) {
  $("notificationCount").textContent = state.notifications.length;
 }
}

fillShopForm();
renderAll();
