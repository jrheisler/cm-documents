document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  function bootstrap() {
    const button = document.createElement('button');
    button.textContent = 'Start';
    button.addEventListener('click', () => {
      console.log('CM2Git started');
    });
    app.appendChild(button);
  }

  if (app) {
    bootstrap();
  }
});
