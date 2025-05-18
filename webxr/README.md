# Generic WebXR Experience

A flexible and reusable WebXR boilerplate that can be easily forked and customized for various VR projects.

## Features

- **VR Scene Setup**: Basic responsive scene using Three.js and WebXR API
- **Navigation and Interaction**: Teleportation, controller input handling, and object interaction
- **Responsive UI System**: VR-compatible UI panels that adapt to different devices
- **Controller Input Handling**: Support for various VR controllers with standardized input mapping
- **Environment Loader**: Support for loading custom 3D models and skyboxes
- **Spatial Audio**: Immersive audio system with 3D positioning
- **Performance Monitoring**: Built-in FPS counter and performance tools
- **Multiplayer Support**: Basic networking infrastructure for multi-user experiences
- **Fallback Mechanisms**: Graceful fallback to non-VR mode when WebXR is unavailable

## Project Structure

```
webxr/
├── index.html              # Main entry point
├── src/
│   ├── core/               # Core WebXR functionality
│   │   ├── main.js         # Main application entry point
│   │   ├── xr-session.js   # WebXR session management
│   │   ├── environment.js  # 3D environment setup
│   │   ├── controllers.js  # VR controller handling
│   ├── ui/                 # User interface components
│   │   ├── styles.css      # CSS styles
│   │   ├── ui-panel.js     # UI management
│   ├── utils/              # Utility functions
│   │   ├── input-manager.js       # Input handling
│   │   ├── performance-monitor.js # Performance tracking
│   ├── audio/              # Audio system
│   │   ├── audio-manager.js # Spatial audio management
│   ├── network/            # Networking components
│   │   ├── multiplayer.js  # Multiplayer functionality
│   ├── assets/             # Assets (models, textures, audio)
│       ├── models/         # 3D models
│       ├── textures/       # Textures
│       ├── audio/          # Audio files
├── packaging/              # Distribution packaging guides
    ├── pwa/                # Progressive Web App packaging
    ├── quest/              # Meta Quest Store packaging
    ├── steamvr/            # SteamVR/PCVR packaging
```

## Getting Started

### Prerequisites

- A WebXR-compatible browser (Chrome, Firefox, Edge with WebXR support)
- A VR headset (Oculus Quest, HTC Vive, Valve Index, etc.) for full VR experience
- Basic knowledge of HTML, CSS, and JavaScript

### Running the Experience

1. Clone this repository
2. Serve the files using a local web server:
   - Using Python: `python -m http.server`
   - Using Node.js: `npx serve`
3. Open the browser and navigate to the local server (typically `http://localhost:8000` or `http://localhost:3000`)
4. Click the "Enter VR" button to start the VR experience

### Desktop Controls

When not in VR mode, you can navigate the scene using:

- **WASD** or **Arrow Keys**: Move around
- **Mouse**: Look around
- **Space**: Move up
- **Shift**: Move down
- **F**: Toggle fullscreen
- **R**: Reset position
- **Escape**: Exit pointer lock

## VR Controls

In VR mode, you can interact with the environment using:

- **Right Controller Trigger**: Teleport
- **Left Controller Trigger**: Interact with objects
- **Left Controller Grip**: Toggle settings panel
- **Right Controller Thumbstick**: Rotate (snap or smooth turning based on settings)
- **Left Controller Thumbstick**: Move (if smooth locomotion is enabled)

## Distribution Options

This WebXR experience can be distributed in several ways:

### 1. Browser-based WebXR

The simplest approach is to host the files on a web server with HTTPS support. Users can access the experience directly in a WebXR-compatible browser.

### 2. Progressive Web App (PWA)

You can enhance the experience as a Progressive Web App that can be installed from the browser:

- Provides offline support
- Installable on the home screen
- More app-like experience

See the [PWA Packaging Guide](./packaging/pwa/README.md) for details.

### 3. Meta Quest Store App

For distribution on the Meta Quest Store, you can package the experience as a native Android app:

- Full app store presence
- Better integration with Quest features
- Access to Quest-specific APIs

See the [Meta Quest Packaging Guide](./packaging/quest/README.md) for details.

### 4. SteamVR/PCVR App

For distribution on Steam and other PCVR platforms, you can package the experience as an Electron app:

- Distribution on Steam
- Better integration with SteamVR
- Access to desktop features

See the [SteamVR/PCVR Packaging Guide](./packaging/steamvr/README.md) for details.

For a comprehensive overview of all packaging options, see the [Packaging Guide](./packaging/README.md).

## Customization

### Changing the Environment

To customize the environment, modify the `environment.js` file:

```javascript
// Add custom environment objects
addEnvironmentObjects() {
  // Add your custom objects here
}

// Load a custom environment model
this.loadEnvironmentModel('path/to/your/model.glb');

// Load a custom skybox
this.loadPanoramicSkybox('path/to/your/skybox.jpg');
```

### Adding Interaction

To make objects interactive, register them with the controller manager:

```javascript
// Create an object
const myObject = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
myObject.position.set(0, 1, -2);
scene.add(myObject);

// Make it interactive
controllerManager.registerInteractable(myObject);
```

### Adding Sounds

To add spatial audio:

```javascript
// Load and play a sound at a specific position
audioManager.loadSound('mySound', 'path/to/sound.mp3', {
  spatial: true,
  volume: 0.8,
  loop: false
}).then(() => {
  audioManager.playSound('mySound', new THREE.Vector3(0, 1, -2));
});
```

## Performance Considerations

- Use the built-in performance monitor to track FPS and optimize as needed
- Adjust the quality settings for different devices
- Use the `updateQuality` method in `environment.js` to adjust visual quality based on performance

## Browser Compatibility

This experience works best in browsers with full WebXR support:
- Chrome 79+
- Firefox 76+
- Edge 79+
- Oculus Browser 7.0+

## Integration with Existing Applications

The WebXR experience is designed as a standalone module that can be integrated with existing applications in various ways. For detailed instructions on how to integrate the WebXR experience with your main application, see the [Integration Guide](./integration.md).

### Hono.js Integration

The WebXR experience is primarily designed to be integrated with the main application using Hono.js and served at the `/webxr` URL path. A ready-to-use integration file is provided in [hono-integration.js](./hono-integration.js).

```javascript
// In your main application
import { integrateWebXR } from './webxr/hono-integration.js';

// Integrate WebXR experience at /webxr path
integrateWebXR(app);
```

### Other Integration Options

Alternative integration options include:
- Serving as a separate experience
- Linking from your main application
- Embedding within an iframe
- Direct code integration

## License

This project is available for use under the MIT License.

## Acknowledgments

- Three.js for 3D rendering
- WebXR API for VR functionality