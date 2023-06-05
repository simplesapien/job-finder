const modal = {
  container: document.querySelector(".modal"),
  text: document.querySelector(".modal-text"),
  close: document.querySelector(".modal-close"),
  title: document.querySelector(".modal-title"),
  rating: document.querySelector(".modal-rating"),
  imageContainer: document.querySelector(".modal-image-container"),
};

const loader = document.querySelector(".loader-container");
const overlay = document.querySelector(".overlay");

export function addData(entry) {
  // Start loader animation
  loader.style.visibility = "visible";

  // Show overlay
  overlay.style.visibility = "visible";

  // Add data to modal
  modal.container.style.visibility = "visible";
  modal.title.innerText = entry.restaurant;
  modal.text.innerText = entry.description;
  modal.close.style.visibility = "visible";
  modal.rating.innerText = Math.floor(entry.rating);

  // Add reviews
  let reviews = document.createElement("p");
  reviews.classList.add("modal-reviews");
  reviews.innerText = `(${entry.reviews})`;

  // Add stars
  let starsContainer = document.createElement("div");
  starsContainer.classList.add("modal-stars");

  // Add num of stars
  for (let i = 0; i < modal.rating.innerText; i++) {
    let star = document.createElement("img");
    star.src = "../assets/star.svg";
    starsContainer.appendChild(star);
  }

  // Add them to the DOM
  modal.rating.appendChild(starsContainer);
  modal.rating.appendChild(reviews);

  // Add images
  for (let i = 0; i < 3; i++) {
    let imgContainer = document.createElement("a");
    let img = document.createElement("img");

    imgContainer.href = entry.photos[i].large;
    imgContainer.target = "_blank";
    img.src = entry.photos[i].small;

    imgContainer.appendChild(img);
    modal.imageContainer.appendChild(imgContainer);
  }
  loader.style.visibility = "hidden";
}

export function removeData() {
  // Hide overlay
  overlay.style.visibility = "hidden";

  // Remove data from modal
  modal.rating.innerHTML = "";
  modal.imageContainer.innerHTML = "";
  modal.text.innerHTML = "";
  modal.title.innerHTML = "";
  modal.close.style.visibility = "hidden";
  modal.container.style.visibility = "hidden";
}
