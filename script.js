// ======== DOM Elements ========
const categoryContainer = document.getElementById("category-container");
const plantContainer = document.getElementById("plant-container");
const cartContainer = document.getElementById("cart-container");
const cartTotalElement = document.getElementById("cart-total");
const spinner = document.getElementById("spinner");

// ======== Global State ========
let cart = [];
let activeCategoryBtn = null;
let allPlants = []; // cache all plants

// ======== Load All Categories ========
const loadCategories = async () => {
  try {
    const res = await fetch("https://openapi.programming-hero.com/api/categories");
    const data = await res.json();

    displayCategories(data.categories);
    await loadAllPlants();
  } catch (error) {
    console.error("Error loading categories:", error);
  }
};

// ======== Display Categories ========
const displayCategories = (categories) => {
  categoryContainer.innerHTML = "";
// All Trees button
const allBtn = document.createElement("button");
allBtn.className = "category-btn"; // active class এখন নেই
allBtn.innerText = "All Trees";
allBtn.onclick = () => {
  highlightActive(allBtn);
  displayPlants(allPlants);
};
categoryContainer.appendChild(allBtn);

// Set default active
highlightActive(allBtn);
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

// ======== Highlight Active Button ========
const highlightActive = (btn) => {
  if (activeCategoryBtn) activeCategoryBtn.classList.remove("active");
  btn.classList.add("active");
  activeCategoryBtn = btn;
};

// ======== Load All Plants ========
const loadAllPlants = async () => {
  try {
    spinner.style.display = "block";
    const res = await fetch("https://openapi.programming-hero.com/api/plants");
    const data = await res.json();

    allPlants = data.plants;
    displayPlants(allPlants);
  } catch (error) {
    console.error("Error loading plants:", error);
  } finally {
    spinner.style.display = "none";
  }
};

// ======== Display Plants by Category (Case-insensitive) ========
const displayCategoryPlants = (categoryName) => {
  const filteredPlants = allPlants.filter(
    p => p.category?.trim().toLowerCase() === categoryName.trim().toLowerCase()
  );
  displayPlants(filteredPlants);
};
// ======== Display Plants ========
const displayPlants = (plants) => {
  plantContainer.innerHTML = "";

  if (!plants || plants.length === 0) {
    plantContainer.innerHTML = "<p>No plants found in this category.</p>";
    return;
  }

  plants.forEach((plant) => {
    const card = document.createElement("div");
    card.className = "plant-card";

    card.innerHTML = `
      <img src="${plant.image}" alt="${plant.name}" />
      <h3 class="plant-name" style="cursor:pointer; color:#2a7f62;">${plant.name}</h3>
      <p>${plant.description.substring(0, 80)}...</p>
      <p><strong>🌱 Category:</strong> ${plant.category_name || plant.category}</p>
      <p><strong>💰 Price:</strong> ৳${plant.price || 100}</p>
      <div class="card-actions">
        <button onclick="addToCart(${plant.id}, '${plant.name}', ${plant.price || 100})">Add to Cart</button>
      </div>
    `;

    plantContainer.appendChild(card);

    // Tree name click => show modal
    const nameElement = card.querySelector(".plant-name");
    nameElement.addEventListener("click", () => showDetails(plant));
  });
};

// ======== Show Details in Modal (Local Plant Object) ========
const showDetails = (plant) => {
  const modal = document.getElementById("details-modal");
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" onclick="closeModal()">×</span>
      <img src="${plant.image}" alt="${plant.name}" style="width:100%; height:200px; object-fit:cover; border-radius:8px;" />
      <h2>${plant.name}</h2>
      <p>${plant.description}</p>
      <p><strong>Category:</strong> ${plant.category_name || plant.category}</p>
      <p><strong>Price:</strong> ৳${plant.price || 100}</p>
    </div>
  `;
  modal.style.display = "flex";

  // Close modal on click outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
};

// ======== Close Modal ========
const closeModal = () => {
  const modal = document.getElementById("details-modal");
  modal.style.display = "none";
  modal.innerHTML = "";
};

// ======== Cart Functions ========
const addToCart = (id, name, price) => {
  const existing = cart.find(item => item.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, name, price, qty: 1 });

  updateCart();
};

const removeFromCart = (id) => {
  cart = cart.filter(item => item.id !== id);
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
  cart.forEach(item => {
    total += item.price * item.qty;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `<p>${item.name} (x${item.qty}) - ৳${item.price * item.qty}</p>
                     <button onclick="removeFromCart(${item.id})">❌</button>`;
    cartContainer.appendChild(row);
  });

  cartTotalElement.innerText = `৳${total}`;
};

// ======== Initial Load ========
loadCategories();
