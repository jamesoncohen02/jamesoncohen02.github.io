## Formula 1 Pit Stops: Interactive Exploratory Data Analysis
### CS 1710 Final Project
#### Jameson Cohen

### Project Overview

This project is an **interactive data visualization dashboard** that explores Formula One pit stop data from 2014-2024 (the "hybrid era" of Formula One). It allows users to analyze average pit stop durations across different tracks, constructors (teams), and years. The dashboard includes:
- A **Globe Visualization** showing average pit stop times by track location.
- A **Bar Chart** comparing average pit stop durations by constructor. The colors of each bar are matched to the team colors of the actual constructors, for those who are familiar with the constructors in Formula One.
- A **Scatter Plot** visualizing the relationship between pit stop durations and final race positions. Again, the colors of the circles in the scatter plot are the same as the team colors of the constructor who achieved that pit stop time.

### Project Backround / Inspiration

This project was inspired by my group final project for CS 1090a, where we are also working with the same dataset. In particular, this project is meant to serve as the interactive Exploratory Data Analysis for my CS1090a project (for which we are also working on various forms of machine learning and modeling to predict race outcomes based on pit stop durations and other predictor variables).

### Code Overview, Data, Libraries

All individual files in my submission (other than my data file) are a product of my own work, as opposed to APIs or code generated by particular libraries. This includes ``index.html``, all ``main.js``, ``globeVis.js``, ``barchart.js``, ``scatterplot.js`` and ``style.css``.

The dataset ``results_pitstops.csv`` is a cleaned version of the data available on [this Kaggle page](https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020) that my CS1090a group created in our data cleaning process. One can view my cleaned dataset in the submitted folder under ``data/results_pitstops.csv``. One can also view a description of the relevant data fields in the file under ``data/data_description.pdf``.


With that being said, I do use a couple libraries in my code (though not as direct files, rather they are included in the ``index.html`` file). Given that they are already linked in ``index.html``, no viewer should need to re-download them. These libraries include d3, topojson, Bootstrap, and noUIslider. Additionally, I would like to acknowledge that, throughout the coding process, I used chatGPT to help supplement when I did not understand how to implement something in particular. To be clear, I did not copy any large blocks of code or ever include any code without understanding it.

### Running My Code, Viewing My Submissions

The main file to view when viewing my submission is ``index.html``. If a viewer opens ``index.html`` on their local browser, they should be able to view my interactive EDA.

Additionally, my final project is hosted on [https://jamesoncohen02.github.io/](https://jamesoncohen02.github.io/). One can view my 2-minute screencast walking through my final project at [this link](https://drive.google.com/file/d/15l8xqVwZL2_1HUIjA0enlj8uMTmsEDVe/view?usp=sharing).
