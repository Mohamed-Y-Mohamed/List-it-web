"use client";

// A run of task cards, staggered in.
//
// Every task screen spelled this out itself, passing all eighteen props through
// to TaskCard by hand. That is how Today ended up not passing `description`
// while the others did: with eighteen props written out six times, a missing one
// looks like every other line.

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import TaskCard from "@/components/Tasks/customcard";
import type { Collection as SchemaCollection } from "@/types/schema";
import type { TaskActionResult, TaskRow } from "@/types/taskView";

export interface TaskListHandlers {
  onComplete: (
    taskId: string,
    isCompleted: boolean,
  ) => Promise<TaskActionResult>;
  onPriorityChange: (
    taskId: string,
    isPinned: boolean,
  ) => Promise<TaskActionResult>;
  onTaskUpdate: (
    taskId: string,
    data: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    },
  ) => Promise<TaskActionResult>;
  onTaskDelete: (taskId: string) => Promise<TaskActionResult>;
  onCollectionChange: (
    taskId: string,
    collectionId: string,
  ) => Promise<TaskActionResult>;
}

interface TaskListProps extends TaskListHandlers {
  tasks: TaskRow[];
  collections: SchemaCollection[];
  /** Kept as a prop because Completed uses a different accent bar. */
  cardClassName?: string;
  /** Offsets the stagger when a screen renders several lists in a row. */
  indexOffset?: number;
}

export default function TaskList({
  tasks,
  collections,
  cardClassName = "border-l-4",
  indexOffset = 0,
  ...handlers
}: TaskListProps) {
  return (
    <AnimatePresence>
      {tasks.map((task, index) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.5, delay: (indexOffset + index) * 0.1 }}
          className="transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <TaskCard
            id={task.id}
            text={task.text}
            description={task.description}
            created_at={task.created_at}
            due_date={task.due_date}
            due_has_time={task.due_has_time}
            reminders={task.reminders}
            is_completed={task.is_completed}
            date_completed={task.date_completed}
            is_pinned={task.is_pinned}
            collection_id={task.collection_id}
            list_id={task.list_id}
            user_id={task.user_id}
            collection_name={task.collection_name}
            list_name={task.list_name}
            collections={collections}
            className={cardClassName}
            {...handlers}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
