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
  loader.style.opacity = "1";
  loader.style.visibility = "visible";

  // Show overlay
  overlay.style.opacity = "0.7";
  overlay.style.visibility = "visible";
  overlay.addEventListener("click", () => removeData());

  // Add data to modal
  modal.container.style.visibility = "visible";
  modal.title.innerText = entry.restaurant;
  modal.text.innerText = entry.description;
  modal.close.style.visibility = "visible";
  modal.imageContainer.style.display = "flex";

  // Check to see whether the db has the info we need from it's Places API call
  if (entry.rating) {

    modal.rating.innerText = entry.rating

    // Add reviews
    let reviews = document.createElement("p");
    reviews.classList.add("modal-reviews");
    reviews.innerText = `(${entry.reviews})`;

    // Add stars
    let starsContainer = document.createElement("div");
    starsContainer.classList.add("modal-stars");

    // Add num of stars
    for (let i = 0; i < Math.floor(entry.rating); i++) {
      let star = document.createElement("img");
      star.src = "../assets/star.png";
      starsContainer.appendChild(star);
    }

    // If the star rating is 4.5 or higher, add a half-star
    if (entry.rating >= 4.5) {
      let star = document.createElement("img");
      star.src = "../assets/halfstar.png";
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
  } else {
    // If the cloud function hasn't filled in the db properly, show a message
    modal.rating.innerText = "No data available";

    // Collapse the image container
    modal.imageContainer.style.display = "none";
  }

  loader.style.opacity = "0";
  loader.style.visibility = "hidden";
}

export function removeData() {

  // Hide overlay
  overlay.style.opacity = "0";
  overlay.style.visibility = "hidden";

  // Collapse the image container
  modal.imageContainer.style.display = "none";

  // Remove data from modal
  modal.rating.innerHTML = "";
  modal.imageContainer.innerHTML = "";
  modal.text.innerHTML = "";
  modal.title.innerHTML = "";
  modal.close.style.visibility = "hidden";
  modal.container.style.visibility = "hidden";
}
