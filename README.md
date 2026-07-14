# Pong Game

A classic Pong game implemented using HTML, CSS, and JavaScript, designed for both desktop and mobile play.

## Features

*   **Classic Gameplay:**
    *   Engage in a fast-paced game of Pong against an AI opponent.
    *   Experience ball physics that includes bouncing off walls and paddles.
    *   Enjoy a gradually increasing difficulty as levels progress.

*   **Intuitive User Interface:**
    *   Responsive design that adapts to various screen sizes and orientations.
    *   Clean, modern look with clear visual feedback for game events.
    *   Vibrant colors and subtle glows for engaging visuals.
    *   Subtle UI animations on the game over screen
    *   Easy to read scoreboard to keep track of scores

*   **Sound Effects:**
    *   Basic sound effects for scoring points and paddle hits.
    *   Uses music for a more engaging audio experience

*   **Flexible Controls:**
    *   Keyboard controls using the Up and Down arrow keys for left paddle movement.
    *   Responsive touch controls for mobile devices

*   **Level Progression:**
    *   Ball speed increases as the player progresses through levels, adding to the challenge.

## How to Play

*   **Desktop:**
    *   Use the `Up Arrow` and `Down Arrow` keys to move the left paddle vertically.
    *   The right paddle (AI) moves automatically.

*   **Mobile:**
    *   Touch the left side of the screen to move the left paddle.
    *   Touch the right side of the screen to move the right paddle.

## Technologies Used

*   HTML
*   CSS (with subtle animations)
*   JavaScript
*   Canvas API
*   Audio API

## Challenges Faced

*   **Precise Collision Detection:** Creating accurate and responsive collision detection between the ball, paddles, and boundaries.
*   **Intelligent AI Opponent:** Developing a fair AI opponent using JavaScript that is still challenging.
*   **Mobile Touch Input:** Designing responsive and precise touch controls for a good mobile experience.
*   **Consistent UI:** Implementing a responsive and consistent UI across various devices and orientations.
*   **Ball Speed Control:** Implementing ball speed increases to a fixed maximum and ensuring the ball won't get stuck on the paddles

## Future Improvements

*   **Enhanced Multiplayer:** Implement a local or online multiplayer mode for two-player gameplay.
*   **AI Customization:** Allow users to select AI difficulty levels.
*   **Gameplay Enhancements:** Add power-ups for paddle and ball speed or size adjustments.
*   **Visuals:** Add a wider variety of particle effects, background animations, and color schemes.
*   **Audio:** Improve sound design with more varied and immersive audio.
*   **Options Menu:** Add an in game options menu
*   **Improved Touch Controls:** Implement a better paddle tracking system that does not need a touch and move, but rather a tap system that will move the paddle to the tap location.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

## Setup

1. Clone the repository:
    ```sh
    git clone <your-repo-url>
    cd Pong-Game-
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Run the game locally:
    ```sh
    npm start
    ```

## GitHub Actions

This project uses GitHub Actions to automate the deployment process. The workflow file is located at `.github/workflows/deploy.yml`.

To set up GitHub Actions:

1. Ensure you have a `GITHUB_TOKEN` secret set up in your repository settings.
2. Push your changes to the `main` branch to trigger the workflow.
