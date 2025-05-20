let currentSlide = 0;
      const slides = document.querySelectorAll(".slide");

      function showNextSlide() {
        slides[currentSlide].classList.remove("active");
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add("active");
      }
      setInterval(showNextSlide, 2000);

      function scrollToHome() {
        document.getElementById("about").style.display = "none";
        document.getElementById("home").style.display = "block";
        window.scrollTo({
          top: document.getElementById("home").offsetTop,
          behavior: "smooth",
        });
      }
      async function fetchEmptyShelves() {
        try {
          let response = await fetch("http://localhost:3000/empty-shelves");
          let data = await response.json();
          document.getElementById("shelfNumber").innerText =
            data.emptyShelves || "Error fetching data";
        } catch (error) {
          document.getElementById("shelfNumber").innerText =
            "Error fetching data";
          console.error("Error fetching empty shelves:", error);
        }
      }

      // Fetch count every 5 seconds
      setInterval(fetchEmptyShelves, 5000);

      // Fetch immediately on page load
      fetchEmptyShelves();

      function scrollToAbout() {
        document.getElementById("home").style.display = "none"; // Hide the images section
        let aboutSection = document.getElementById("about");
        aboutSection.style.display = "block";
        window.scrollTo({
          top: aboutSection.offsetTop,
          behavior: "smooth",
        });
      }
      window.onload = fetchEmptyShelves;
      setInterval(fetchEmptyShelves, 5000);

      function authenticateFingerprint(callback) {
        const scanFingerprint = confirm("Please scan your fingerprint.");
        if (scanFingerprint) {
          const fingerprintId = prompt("Enter your fingerprint ID:");
          if (fingerprintId) {
            callback(fingerprintId);
          } else {
            document.getElementById("statusMessage").textContent =
              "Fingerprint authentication failed.";
          }
        } else {
          document.getElementById("statusMessage").textContent =
            "Fingerprint scan canceled.";
        }
      }

      document
        .getElementById("checkInBtn")
        .addEventListener("click", function () {
          authenticateFingerprint((fingerprintId) => {
            fetch(`/checkin/${fingerprintId}`)
              .then((response) => response.json())
              .then((data) => {
                document.getElementById("statusMessage").textContent =
                  data.message || "Check-in failed.";
              })
              .catch((error) => {
                document.getElementById("statusMessage").textContent =
                  "Error during check-in.";
              });
          });
        });

      document
        .getElementById("checkOutBtn")
        .addEventListener("click", function () {
          authenticateFingerprint((fingerprintId) => {
            fetch(`/checkout/${fingerprintId}`)
              .then((response) => response.json())
              .then((data) => {
                document.getElementById("statusMessage").textContent =
                  data.message || "Check-out failed.";
              })
              .catch((error) => {
                document.getElementById("statusMessage").textContent =
                  "Error during check-out.";
              });
          });
        });

      fetchEmptyShelves();
      setInterval(fetchEmptyShelves, 5000);
