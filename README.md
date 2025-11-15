# Advanced Load Balancer Server

A feature-rich load balancer with multiple algorithms, sticky sessions, and path-based routing.

## Features

- **Multiple Load Balancing Algorithms:** Choose from various strategies to distribute traffic.
- **Sticky Sessions:** Ensures a client is consistently routed to the same server.
- **Path-Based Routing:** Directs traffic to different backend services based on the URL path.
- **Health Checks:** Automatically monitors the health of backend servers and removes unhealthy ones from the rotation.
- **Dynamic Configuration:** Update the server list and settings without restarting the load balancer.

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd advanced-loadbalancer-server
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

## Usage

To start the load balancer, run the following command:

```bash
npm start
```

The server will start and begin forwarding requests to the configured backend servers.

## Configuration

The load balancer's configuration is located in `config.json`. Here you can define:

-   The load balancing strategy.
-   The list of backend servers.
-   Health check intervals and paths.
-   Path-based routing rules.

## Dependencies

-   [axios](https://www.npmjs.com/package/axios): Promise based HTTP client for the browser and node.js.
-   [cookie-parser](https://www.npmjs.com/package/cookie-parser): Parse Cookie header and populate `req.cookies`.
-   [express](https://www.npmjs.com/package/express): Fast, unopinionated, minimalist web framework for Node.js.
-   [node-cron](https://www.npmjs.com/package/node-cron): A simple cron-like job scheduler for Node.js.
-   [winston](https://www.npmjs.com/package/winston): A logger for just about everything.

## License

This project is licensed under the ISC License.
