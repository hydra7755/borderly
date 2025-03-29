// Helper script to test navigation
console.log('Navigation test script loaded');

// Function to test sidebar navigation
function testSidebarNavigation() {
  console.log('Testing sidebar navigation...');
  
  // Get all navigation buttons in the sidebar
  const navButtons = document.querySelectorAll('.w-full.flex.items-center.px-3.py-2.rounded-md.text-sm.font-medium');
  
  console.log(`Found ${navButtons.length} navigation buttons`);
  
  // Log button information
  navButtons.forEach((button, index) => {
    console.log(`Button ${index}: ${button.textContent.trim()}`);
    
    // Add click event listener to debug navigation
    button.addEventListener('click', function(e) {
      console.log(`Clicked: ${button.textContent.trim()}`);
      console.log('Navigation event details:', e);
    });
  });
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, waiting for sidebar to render...');
  
  // Try to find the sidebar after a short delay
  setTimeout(testSidebarNavigation, 2000);
});

// Also export a function to test navigation programmatically
window.testNavigation = function(linkText) {
  const navButtons = document.querySelectorAll('.w-full.flex.items-center.px-3.py-2.rounded-md.text-sm.font-medium');
  
  for (const button of navButtons) {
    if (button.textContent.trim().includes(linkText)) {
      console.log(`Clicking on: ${linkText}`);
      button.click();
      return true;
    }
  }
  
  console.log(`Navigation button not found: ${linkText}`);
  return false;
}; 