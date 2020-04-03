import AppController from './app';

// Handles communication to/from frontend via websockets
class SocketController {
  controller: AppController;

  constructor (controller: AppController) {
    this.controller = controller;
  }

  initEventListeners() {
    // listen to messages sent from frontend, call appropriate method on appcontroller 
  }

  async start() {

  }

  async sendMessage () {
    
  }
}

export default SocketController;