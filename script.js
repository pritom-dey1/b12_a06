// ======== DOM Elements ========
const categoryContainer = document.getElementById("category-container");
const plantContainer = document.getElementById("plant-container");
const cartContainer = document.getElementById("cart-container");
const cartTotalElement = document.getElementById("cart-total");
const spinner = document.getElementById("spinner");

// ======== Global State ========
let cart = [];
let activeCategoryBtn = null;
let allPlants = [];
let loadedCount = 0;          
const BATCH_SIZE = 6;         

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
  allBtn.className = "category-btn";
  allBtn.innerText = "All Trees";
  allBtn.onclick = () => {
    highlightActive(allBtn);
    displayPlants(allPlants, true);
  };
  categoryContainer.appendChild(allBtn);

  // Set default active
  highlightActive(allBtn);

  // Other categories
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
    displayPlants(allPlants, true);
  } catch (error) {
    console.error("Error loading plants:", error);
  } finally {
    spinner.style.display = "none";
  }
};

// ======== Display Plants by Category ========
const displayCategoryPlants = (categoryName) => {
  const filteredPlants = allPlants.filter(
    p => p.category?.trim().toLowerCase() === categoryName.trim().toLowerCase()
  );
  displayPlants(filteredPlants, true);
};

// ======== Display Plants with Infinite Scroll + Animation ========
const displayPlants = (plants, reset = true) => {
  if (reset) {
    plantContainer.innerHTML = "";
    loadedCount = 0;
  }

  // slice দিয়ে নতুন batch আনা
  const nextBatch = plants.slice(loadedCount, loadedCount + BATCH_SIZE);
  loadedCount += nextBatch.length;

  nextBatch.forEach((plant, idx) => {
    const card = document.createElement("div");
    card.className = "plant-card hidden"; // hidden দিয়ে শুরু

    card.innerHTML = `
      <img src="${plant.image}" alt="${plant.name}" />
      <h3 class="plant-name">${plant.name}</h3>
      <p>${plant.description.substring(0, 50)}...</p>
      
      <div style="margin-top:10px;display: flex;align-items: center;justify-content: space-between;">
        <p style="color:#34a853;background-color:#dcfce7;padding:5px;border-radius:5px;font-size:12px;">
          ${plant.category_name || plant.category}
        </p>
        <p style="color:#1f2937;font-weight:600;">৳${plant.price || 100}</p>
      </div>
      <div class="card-actions">
        <button onclick="addToCart(${plant.id}, '${plant.name}', ${plant.price || 100})">Add to Cart</button>
      </div>
    `;

    plantContainer.appendChild(card);

    const nameElement = card.querySelector(".plant-name");
    nameElement.addEventListener("click", () => showDetails(plant));
  });

  // নতুন কার্ড observe করানো
  observeCards();
};

// ======== Infinite Scroll ========
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    if (activeCategoryBtn && activeCategoryBtn.innerText === "All Trees") {
      displayPlants(allPlants, false); // reset = false → আগেরগুলো থাকবে
    }
  }
});

// ======== Intersection Observer for stagger animation ========
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const allCards = [...document.querySelectorAll(".plant-card")];
        const index = allCards.indexOf(card);

        // row-wise stagger: প্রতি row এ 3টা card ধরা হচ্ছে
        const delay = (index % 3) * 0.2; 
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
// ======== Show Details in Modal ========
const showDetails = (plant) => {
  const modal = document.getElementById("details-modal");
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" onclick="closeModal()">×</span>
      <img src="${plant.image}" alt="${plant.name}" style="width:100%; height:200px; object-fit:cover; border-radius:8px;" />
      <h2>${plant.name}</h2>
      <p>${plant.description}</p>
        <div style="margin-top:10px;display: flex;align-items: center;justify-content: space-between;">
        <p style="color:#34a853;background-color:#dcfce7;padding:5px;border-radius:5px;font-size:12px;"> ${plant.category_name || plant.category}</p>
      <p> ৳${plant.price || 100}</p>
      </div>
     
    </div>
  `;
  modal.style.display = "flex";

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
