/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type: "success" | "error" | "info" | "warning"
 */
export const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.className = "toast toast-top toast-end z-50";

  const alertClass =
    type === "error"
      ? "alert-error"
      : type === "warning"
      ? "alert-warning"
      : type === "info"
      ? "alert-info"
      : "alert-success";

  const iconPath =
    type === "error"
      ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      : type === "warning"
      ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      : type === "info"
      ? "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";

  toast.innerHTML = `
    <div class="alert ${alertClass} shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}" />
      </svg>
      <div>
        <div class="font-semibold">${message}</div>
      </div>
      <button class="btn btn-sm btn-circle btn-ghost ml-auto" onclick="this.closest('.toast').remove()">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  // Auto remove setelah 4 detik
  const autoRemoveTimeout = setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.classList.add("opacity-0", "transition-opacity", "duration-300");
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }
  }, 4000);

  // Clear timeout jika user manual close
  const closeButton = toast.querySelector("button");
  closeButton.addEventListener("click", () => {
    clearTimeout(autoRemoveTimeout);
  });
};
