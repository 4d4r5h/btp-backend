<div align="center">

A B. Tech [Project Report](https://drive.google.com/file/d/1d9S5I-IVRIFFwe565U7nEWzvma4Rmh33/view?usp=sharing)  
submitted in partial fulfillment of the requirements for the degree of  
Bachelor of Technology  
by  
[Animesh Kumar Sinha](https://www.linkedin.com/in/animesh-kumar-sinha/) (2001CS07)  
and  
[Adarsh Kumar](https://www.linkedin.com/in/4d4rsh/) (2001CS02)  
under the guidance of **Dr. Samrat Mondal**  
to the  
**DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING**  
**INDIAN INSTITUTE OF TECHNOLOGY PATNA**  
**PATNA - 800013, BIHAR**  

</div>


# Optimized EV Routing and Charging Station Finder - Backend

This project focuses on developing the backend for a mobile application that optimizes electric vehicle (EV) routing and finds charging stations efficiently using advanced pathfinding algorithms. The backend is built using Node.js and Express.js, and integrates MongoDB for data storage. It also includes comprehensive testing methodologies to ensure performance and reliability.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/4d4r5h/btp-backend.git
   ```
2. Navigate to the project directory:
   ```bash
   cd btp-backend
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Create a `.env` file in the root directory and add the following environment variables:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   TOMTOM_API_KEY=your_tomtom_api_key
   ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```
2. The server will run on `http://localhost:3000`.
