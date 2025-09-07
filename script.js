// ==================== DOM ELEMENTS ====================
const categoryContainer = document.getElementById("category-container");
const plantContainer = document.getElementById("plant-container");
const cartContainer = document.getElementById("cart-container");
const cartTotalElement = document.getElementById("cart-total");
const spinner = document.getElementById("spinner");

// ==================== GLOBAL STATE ====================
let cart = [];
let activeCategoryBtn = null;
let allPlants = [];
let loadedCount = 0;
const BATCH_SIZE = 6; // Number of plants to load per batch

// ==================== LOAD CATEGORIES ====================
const loadCategories = async () => {
  try {
    const res = await fetch("https://openapi.programming-hero.com/api/categories");
    const data = await res.json();

    displayCategories(data.categories);
    await loadAllPlants(); // Load all plants after categories
  } catch (error) {
    // Handle API errors
    alert("Failed to load categories.");
  }
};

// ==================== DISPLAY CATEGORIES ====================
const displayCategories = (categories) => {
  categoryContainer.innerHTML = "";

  // "All Trees" button
  const allBtn = document.createElement("button");
  allBtn.className = "category-btn";
  allBtn.innerText = "All Trees";
  allBtn.onclick = () => {
    highlightActive(allBtn);
    displayPlants(allPlants, true);
  };
  categoryContainer.appendChild(allBtn);

  // Set default active button
  highlightActive(allBtn);

  // Display other categories
  categories.forEach((cat) => {
    const button = document.createElement("button");
    button.className = "category-btn";
    button.innerText = cat.category_name;
    button.onclick = () => {
      highlightActive(button);
      displayCategoryPlants(cat.category_name);
    };
    categoryContainer.appendChild(button);
  });
};

// ==================== HIGHLIGHT ACTIVE BUTTON ====================
const highlightActive = (btn) => {
  if (activeCategoryBtn) activeCategoryBtn.classList.remove("active");
  btn.classList.add("active");
  activeCategoryBtn = btn;
};

// ==================== LOAD ALL PLANTS ====================
const loadAllPlants = async () => {
  try {
    spinner.style.display = "block";
    const res = await fetch("https://openapi.programming-hero.com/api/plants");
    const data = await res.json();

    allPlants = data.plants;
    displayPlants(allPlants, true);
  } catch (error) {
    alert("Failed to load plants.");
  } finally {
    spinner.style.display = "none";
  }
};

// ==================== DISPLAY PLANTS BY CATEGORY ====================
const displayCategoryPlants = (categoryName) => {
  const filteredPlants = allPlants.filter(
    (p) => p.category?.trim().toLowerCase() === categoryName.trim().toLowerCase()
  );
  displayPlants(filteredPlants, true);
};

// ==================== DISPLAY PLANTS WITH INFINITE SCROLL ====================
const displayPlants = (plants, reset = true) => {
  if (reset) {
    plantContainer.innerHTML = "";
    loadedCount = 0;
  }

  // Load the next batch of plants
  const nextBatch = plants.slice(loadedCount, loadedCount + BATCH_SIZE);
  loadedCount += nextBatch.length;

  nextBatch.forEach((plant) => {
    const card = document.createElement("div");
    card.className = "plant-card hidden";

    card.innerHTML = `
      <img src="${plant.image}" alt="${plant.name}" />
      <h3 class="plant-name">${plant.name}</h3>
      <p>${plant.description.substring(0, 50)}...</p>
      <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
        <p style="color:#34a853; background-color:#dcfce7; padding:5px; border-radius:5px; font-size:12px;">
          ${plant.category_name || plant.category}
        </p>
        <p style="color:#1f2937; font-weight:600;">৳${plant.price || 100}</p>
      </div>
      <div class="card-actions">
        <button onclick="addToCart(${plant.id}, '${plant.name}', ${plant.price || 100})">Add to Cart</button>
      </div>
    `;

    plantContainer.appendChild(card);

    // Show modal on plant name click
    const nameElement = card.querySelector(".plant-name");
    nameElement.addEventListener("click", () => showDetails(plant));
  });

  // Observe new cards for animation
  observeCards();
};

// ==================== INFINITE SCROLL EVENT ====================
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    if (activeCategoryBtn && activeCategoryBtn.innerText === "All Trees") {
      displayPlants(allPlants, false);
    }
  }
});

// ==================== INTERSECTION OBSERVER FOR STAGGER ANIMATION ====================
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const allCards = [...document.querySelectorAll(".plant-card")];
        const index = allCards.indexOf(card);

        const delay = (index % 3) * 0.2; // stagger per row
        card.style.animationDelay = `${delay}s`;

        card.classList.add("show");
        observer.unobserve(card);
      }
    });
  },
  { threshold: 0.2 }
);

const observeCards = () => {
  const cards = document.querySelectorAll(".plant-card.hidden");
  cards.forEach((card) => observer.observe(card));
};

// ==================== SHOW PLANT DETAILS MODAL ====================
const showDetails = (plant) => {
  const modal = document.getElementById("details-modal");
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" onclick="closeModal()">×</span>
      <img src="${plant.image}" alt="${plant.name}" style="width:100%; height:200px; object-fit:cover; border-radius:8px;" />
      <h2>${plant.name}</h2>
      <p>${plant.description}</p>
      <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
        <p style="color:#34a853; background-color:#dcfce7; padding:5px; border-radius:5px; font-size:12px;">
          ${plant.category_name || plant.category}
        </p>
        <p>৳${plant.price || 100}</p>
      </div>
    </div>
  `;
  modal.style.display = "flex";

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
};

// ==================== CLOSE MODAL ====================
const closeModal = () => {
  const modal = document.getElementById("details-modal");
  modal.style.display = "none";
  modal.innerHTML = "";
};

// ==================== CART FUNCTIONS ====================
const addToCart = (id, name, price) => {
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, name, price, qty: 1 });

  updateCart();
};

const removeFromCart = (id) => {
  cart = cart.filter((item) => item.id !== id);
  updateCart();
};

const updateCart = () => {
  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    cartTotalElement.innerText = "৳0";
    return;
  }

  let total = 0;
  cart.forEach((item) => {
    total += item.price * item.qty;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <p>${item.name} (x${item.qty}) - ৳${item.price * item.qty}</p>
      <button onclick="removeFromCart(${item.id})">❌</button>
    `;
    cartContainer.appendChild(row);
  });

  cartTotalElement.innerText = `৳${total}`;
};

// ==================== INITIAL LOAD ====================
loadCategories();

// ==================== MOBILE MENU TOGGLE ====================
function toggleMenu() {
  const menu = document.getElementById("mobile-menu");
  menu.style.right = menu.style.right === "0px" ? "-250px" : "0px";
}
