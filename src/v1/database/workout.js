/* eslint-disable no-throw-literal */
import { readFileSync } from 'fs'
import find from 'lodash/find.js'
import sortBy from 'lodash/sortBy.js'
import path from 'path'
import cache from 'memory-cache'
import { saveToDB } from './utils.js'

/**
 * @openapi
 * components:
 *   schemas:
 *     workout:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: uCUsLgMmCjBDvWBX7RnOr
 *         name:
 *           type: string
 *           example: Maverick
 *         mode:
 *           type: string
 *           example: For Time
 *         equipment:
 *           type: array
 *           items:
 *             type: string
 *           example: ["barbell", "rope"]
 *         exercises:
 *           type: array
 *           items:
 *             type: string
 *           example: ["21 thrusters", "12 rope climbs, 15 ft", "15 thrusters", "9 rope climbs, 15 ft", "9 thrusters", "6 rope climbs, 15 ft"]
 *         createdAt:
 *           type: string
 *           example: 6/21/2023, 6:01:23 PM
 *         updatedAt:
 *           type: string
 *           example: 6/21/2023, 3:11:30 PM
 *         trainerTips:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Split the 21 thrusters as needed", "Try to do the 9 and 6 thrusters unbroken", "RX Weights: 115lb/75lb"]
 */

let DB

const loadDBJSON = () => {
  DB = JSON.parse(readFileSync(path.join(process.cwd(), '/src/v1/database/db.json'), {
    encoding: 'utf-8'
  }))
  cache.put('DB', DB, 300000)
}

loadDBJSON()

const getAllWorkouts = (filterParams) => {
  try {
    const { mode, page, limit, sort } = filterParams
    const cachedDB = cache.get('DB')
    const workouts = cachedDB ? cachedDB.workouts : DB.workouts
    if (sort) {
      sortBy(workouts, (w) => w.sort)
    }
    if (mode) {
      return workouts.filter((workout) => workout.mode.toLowerCase().includes(mode))
    }
    return workouts.slice(limit * (page - 1), page * limit)
  } catch (err) {
    throw new Error(err?.message || err)
  }
}

const getWorkout = (workoutId) => {
  try {
    const cachedDB = cache.get('DB')
    const workouts = cachedDB ? cachedDB.workouts : DB.workouts
    const workout = find(workouts,
      (workout) => workout.id === workoutId
    )
    if (!workout) {
      throw ({
        status: 404,
        message: `Workout doesn't exist with the id ${workoutId}`
      })
    }
    return workout
  } catch (err) {
    throw new Error(err?.message || err)
  }
}

const createWorkout = (newWorkout) => {
  try {
    const workoutExists = !!DB.workouts.find(
      (workout) => workout.name === newWorkout.name
    )
    if (workoutExists) {
      throw ({
        status: 400,
        message: `Workout already exists with the name ${newWorkout.name}`
      })
    }
    const updatedWorkouts = DB.workouts.concat(newWorkout)
    DB.workouts = updatedWorkouts
    saveToDB(DB)
    loadDBJSON()
    return newWorkout
  } catch (err) {
    throw new Error(err?.message || err)
  }
}

const updateWorkout = (workoutId, workoutChanges) => {
  try {
    const workout = find(DB.workouts, (workout) => workout.id === workoutId)
    if (!workout) {
      throw ({
        status: 404,
        message: `No workout exists with the id ${workoutId}`
      })
    }
    const updatedWorkout = {
      ...workout,
      ...workoutChanges,
      updatedAt: new Date().toLocaleString('en-us', {
        timeZone: 'UTC'
      })
    }
    const updatedWorkouts = DB.workouts.map((workout) => {
      if (workout.id === workoutId) {
        return updatedWorkout
      }
      return workout
    })
    DB.workouts = updatedWorkouts
    saveToDB(DB)
    loadDBJSON()
    return updatedWorkout
  } catch (err) {
    throw new Error(err?.message || err)
  }
}

const deleteWorkout = (workoutId) => {
  try {
    const workout = find(DB.workouts, (workout) => workout.id === workoutId)
    if (!workout) {
      throw ({
        status: 404,
        message: `No workout exists with the id ${workoutId}`
      })
    }
    const updatedWorkouts = DB.workouts.filter((workout) => workout.id !== workoutId)
    DB.workouts = updatedWorkouts
    saveToDB(DB)
    loadDBJSON()
    return workout
  } catch (err) {
    throw new Error(err?.message || err)
  }
}

export {
  getAllWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout
}
