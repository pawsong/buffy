import * as express from 'express';

import courses from './courses';

export const getCourseList = (req, res) => {
  res.send(courses);
};

export const getCourseById = (req, res) => {
  const { courseId } = req.params;
  const index = -1;
  for (let i = 0; i < courses.length; ++i) {
    const course = courses[i];
    if (course.id === courseId) {
      return res.send(course);
    }
  }
  res.sendStatus(400);
};
