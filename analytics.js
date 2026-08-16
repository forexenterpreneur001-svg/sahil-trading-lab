document.querySelectorAll(".period").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".period").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    // This UI is ready to receive real journal data later.
  });
});
