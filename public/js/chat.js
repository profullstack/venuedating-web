// Chat page functionality

// Initialize after a slight delay to ensure DOM is fully loaded and processed
window.addEventListener('load', function() {
    console.log('Chat.js loaded and window fully loaded');
    
    // Wait a moment for any dynamic content
    setTimeout(() => {
        initializeChat();
    }, 100);
});

function initializeChat() {
    // Add click handlers to message item links
    const messageLinks = document.querySelectorAll('.message-item-link');
    console.log('Message links found:', messageLinks.length);
    
    if (messageLinks.length === 0) {
        console.error('No message links found. Check your HTML structure.');
    }
    
    // Add event listeners to each link
    messageLinks.forEach((link, index) => {
        console.log(`Adding click handler to link ${index}`);
        
        link.addEventListener('click', function(e) {
            console.log('Message link clicked!');
            
            // Get contact info from the message item inside this link
            const messageItem = this.querySelector('.message-item');
            const avatar = messageItem.querySelector('.message-avatar img').src;
            const name = messageItem.querySelector('.contact-name').textContent;
            
            console.log('Contact info:', { name, avatar });
            
            // Store contact info in session storage for the conversation page
            sessionStorage.setItem('contactName', name);
            sessionStorage.setItem('contactAvatar', avatar);
            
            // The link's href will handle the navigation to conversation.html
            // No need to prevent default as we want the link to work normally
        });
    });
}
