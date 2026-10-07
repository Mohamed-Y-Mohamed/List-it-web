"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";

import { Collection, List, Note, OperationResult, Task } from "@/types/schema";

import CollectionComponent from "@/components/Collection/index";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

import ListFilterPlus from "@/components/popupModels/ListFilter";
import CreateCollectionModal from "@/components/popupModels/CollectionPopup";
import CreateTaskModal from "@/components/popupModels/TaskPopup";
import CreateNoteModal from "@/components/popupModels/notepopup";
import DeleteCollectionModal from "@/components/popupModels/deleteCollectionModal";
import EditCollectionPopup from "@/components/popupModels/EditCollectionPopup";

import { apiFetch } from "@/lib/apiFetch";
import { applyCompletion } from "@/lib/completion";
import { IS_NATIVE_BUILD } from "@/lib/platform";

import { useSetScreenTitle } from "@/components/native/ScreenTitleContext";
import { useOptionalAppData } from "@/components/native/AppDataProvider";

import AppSurface from "@/components/AppSurface";

/* =========================================================
   TYPES
   ========================================================= */

interface ListDetailCache {
  list: List;
  collections: Collection[];
  savedAt: number;
}

/* =========================================================
   WEB CACHE

   sessionStorage survives:
   - component unmounts
   - navigation to another page
   - returning to the list
   - browser refresh in the same tab

   It is cleared when the browser tab/session ends.
   ========================================================= */

const CACHE_PREFIX = "list-it:list-detail:";

const getCacheKey = (listId: string) => `${CACHE_PREFIX}${listId}`;

const readListCache = (listId: string): ListDetailCache | null => {
  if (typeof window === "undefined" || !listId) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(getCacheKey(listId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as ListDetailCache;

    if (!parsed || !parsed.list || !Array.isArray(parsed.collections)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Failed to read List Detail cache:", error);

    return null;
  }
};

const writeListCache = (
  listId: string,
  list: List | null,
  collections: Collection[],
) => {
  if (typeof window === "undefined" || !listId || !list) {
    return;
  }

  try {
    const cache: ListDetailCache = {
      list,
      collections,
      savedAt: Date.now(),
    };

    window.sessionStorage.setItem(getCacheKey(listId), JSON.stringify(cache));
  } catch (error) {
    console.warn("Failed to write List Detail cache:", error);
  }
};

/* =========================================================
   DATE FORMATTER
   ========================================================= */

const formatDateForPostgres = (date: Date): string => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");

  const minutes = String(date.getMinutes()).padStart(2, "0");

  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/* =========================================================
   DELETE TASK API
   ========================================================= */

const handleTaskDelete = async (taskId: string) => {
  try {
    const res = await apiFetch("/api/tasks", {
      method: "DELETE",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        id: taskId,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();

      throw new Error(errData.error || "Failed to delete task");
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting task:", error);

    return {
      success: false,
      error,
    };
  }
};

/* =========================================================
   COMPONENT
   ========================================================= */

export default function ListDetailView({ listId }: { listId: string }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const isDark = theme === "dark";

  /*
   * Set when a reminder was tapped: NativeShell's notification handler routes
   * here with the task
   * id in the query. Only the collection holding that task opens; the rest of
   * the screen stays shut, which is the point of arriving from a notification
   * about one task.
   */
  const reminderTaskId = searchParams?.get("task") ?? null;

  /* =======================================================
     MODALS
     ======================================================= */

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const [isDeleteCollectionModalOpen, setIsDeleteCollectionModalOpen] =
    useState(false);

  const [isEditCollectionModalOpen, setIsEditCollectionModalOpen] =
    useState(false);

  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

  const [collectionToEdit, setCollectionToEdit] = useState<Collection | null>(
    null,
  );

  /* =======================================================
     DATA
     ======================================================= */

  const [listData, setListData] = useState<List | null>(null);

  const [collections, setCollections] = useState<Collection[]>([]);

  /*
   * Bumped by "Collapse all". Each collection owns whether it is open, so the
   * instruction travels down as a counter rather than by lifting that state
   * up: lifting it would make the screen the owner of something only the
   * collection cares about, and hand every expand a re-render of the page.
   */
  const [collapseNonce, setCollapseNonce] = useState(0);

  /* The floating Add is portalled, so it cannot render on the server pass. */
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => {
    setPortalReady(true);
  }, []);

  const collapseAllCollections = useCallback(() => {
    setCollapseNonce((previous) => previous + 1);
  }, []);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [loadingMessage, setLoadingMessage] = useState(
    "Loading collections...",
  );

  /*
   * Used only for explicit quiet revalidation.
   *
   * Unlike the old implementation this does NOT
   * automatically turn the page back into a
   * loading screen.
   */
  const [revalidationTrigger, setRevalidationTrigger] = useState(0);

  const appData = useOptionalAppData();

  useSetScreenTitle(listData?.list_name ?? null);

  /* =======================================================
     HELPERS
     ======================================================= */

  const isGeneralCollection = useCallback(
    (collectionName: string | null): boolean => {
      if (!collectionName) {
        return false;
      }

      return collectionName.trim().toLowerCase() === "general";
    },
    [],
  );

  const sortRows = useCallback(
    <
      T extends {
        is_pinned: boolean | null;
        created_at: Date | string;
      },
    >(
      rows: T[],
    ): T[] =>
      [...rows].sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) {
          return a.is_pinned ? -1 : 1;
        }

        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }),
    [],
  );

  /* =======================================================
     DEFAULT COLLECTION
     ======================================================= */

  const defaultCollectionId = useMemo(() => {
    const general = collections.find((collection) =>
      isGeneralCollection(collection.collection_name),
    );

    if (general) {
      return general.id;
    }

    return collections.length > 0 ? collections[0].id : null;
  }, [collections, isGeneralCollection]);

  /* =======================================================
     UPDATE LOCAL COLLECTIONS + CACHE

     All local collection mutations go through this helper.
     This means the UI and web cache stay synchronized.
     ======================================================= */

  const updateCollections = useCallback(
    (updater: Collection[] | ((previous: Collection[]) => Collection[])) => {
      setCollections((previous) => {
        const next =
          typeof updater === "function" ? updater(previous) : updater;

        if (!IS_NATIVE_BUILD && listData) {
          writeListCache(listId, listData, next);
        }

        return next;
      });
    },
    [listData, listId],
  );

  /* =======================================================
     KEEP CACHE SYNCHRONIZED WITH CURRENT STATE
     ======================================================= */

  useEffect(() => {
    if (IS_NATIVE_BUILD) {
      return;
    }

    if (!listData) {
      return;
    }

    writeListCache(listId, listData, collections);
  }, [listId, listData, collections]);

  /* =======================================================
     NATIVE CACHE
     ======================================================= */

  const cachedLists = appData?.lists;

  const cachedTasks = appData?.tasks;

  const cachedNotes = appData?.notes;

  const getCachedCollections = appData?.getCollections;

  const putCachedCollections = appData?.putCollections;

  /* =======================================================
     NATIVE — DISPLAY CACHE
     ======================================================= */

  useEffect(() => {
    if (!IS_NATIVE_BUILD || !appData || !listId) {
      return;
    }

    const list = cachedLists?.find((item) => item.id === listId);

    if (list) {
      setListData(list);
    }

    const raw = getCachedCollections?.(listId);

    if (!raw) {
      return;
    }

    setCollections(
      raw.map((collection) => ({
        ...collection,

        tasks: sortRows(
          (cachedTasks ?? []).filter(
            (task) => task.collection_id === collection.id,
          ),
        ),

        notes: sortRows(
          (cachedNotes ?? []).filter(
            (note) => note.collection_id === collection.id,
          ),
        ),

        isPinned: false,

        is_default: isGeneralCollection(collection.collection_name),
      })) as Collection[],
    );

    setError(null);
    setIsLoading(false);
  }, [
    appData,
    listId,
    cachedLists,
    cachedTasks,
    cachedNotes,
    getCachedCollections,
    sortRows,
    isGeneralCollection,
  ]);

  /* =======================================================
     NATIVE — QUIET REVALIDATION
     ======================================================= */

  useEffect(() => {
    if (!IS_NATIVE_BUILD || !appData) {
      return;
    }

    if (!listId || !user) {
      setIsLoading(false);

      setError("List ID or user not available");

      return;
    }

    let cancelled = false;

    const existingCache = getCachedCollections?.(listId);

    if (!existingCache) {
      setIsLoading(true);
    }

    const fetchNativeData = async () => {
      try {
        const [listRes, collectionsRes] = await Promise.all([
          apiFetch(`/api/lists?id=${listId}`),

          apiFetch(`/api/collections?list_id=${listId}`),
        ]);

        if (cancelled) {
          return;
        }

        if (!listRes.ok) {
          throw new Error("Failed to fetch list");
        }

        const { data: fetchedList } = await listRes.json();

        if (!fetchedList) {
          throw new Error("List not found");
        }

        if (!collectionsRes.ok) {
          throw new Error("Failed to fetch collections");
        }

        const { data: collectionsData } = await collectionsRes.json();

        if (cancelled) {
          return;
        }

        setListData(fetchedList as List);

        setError(null);

        putCachedCollections?.(listId, (collectionsData ?? []) as Collection[]);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Error fetching native list data:", error);

        /*
         * If cached content is already
         * visible, don't replace the
         * entire screen with an error.
         */
        if (!getCachedCollections?.(listId)) {
          setError(
            error instanceof Error ? error.message : "An error occurred",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchNativeData();

    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, user, revalidationTrigger]);

  /* =======================================================
     WEB — RESTORE CACHE IMMEDIATELY

     This happens before the network revalidation.

     Returning to the list therefore looks like:

       cache -> display
                ↓
          background fetch
                ↓
          update if changed

     NOT:

       loading -> refetch everything -> display
     ======================================================= */

  useEffect(() => {
    if (IS_NATIVE_BUILD) {
      return;
    }

    if (!listId) {
      return;
    }

    const cached = readListCache(listId);

    if (!cached) {
      return;
    }

    setListData(cached.list);

    setCollections(cached.collections);

    setError(null);
    setIsLoading(false);
  }, [listId]);

  /* =======================================================
     WEB — FETCH COMPLETE LIST

     First visit:
       show loading state

     Return visit:
       cache is already visible
       revalidate quietly

     All task/note requests run IN PARALLEL.
     ======================================================= */

  useEffect(() => {
    if (IS_NATIVE_BUILD) {
      return;
    }

    if (!listId || !user) {
      setIsLoading(false);

      setError("List ID or user not available");

      return;
    }

    let cancelled = false;

    const cached = readListCache(listId);

    /*
     * Only show loading if there is
     * genuinely nothing to display.
     */
    if (!cached) {
      setIsLoading(true);

      setLoadingMessage("Loading collections...");
    }

    const fetchWebListData = async () => {
      try {
        /*
         * Fetch list + collections together.
         *
         * OLD:
         * list -> collections
         *
         * NEW:
         * list + collections
         */
        const [listRes, collectionsRes] = await Promise.all([
          apiFetch(`/api/lists?id=${listId}`),

          apiFetch(`/api/collections?list_id=${listId}`),
        ]);

        if (cancelled) {
          return;
        }

        if (!listRes.ok) {
          const errData = await listRes.json();

          throw new Error(errData.error || "Failed to fetch list");
        }

        if (!collectionsRes.ok) {
          const errData = await collectionsRes.json();

          throw new Error(errData.error || "Failed to fetch collections");
        }

        const { data: fetchedList } = await listRes.json();

        const { data: collectionsData } = await collectionsRes.json();

        if (!fetchedList) {
          throw new Error("List not found");
        }

        if (cancelled) {
          return;
        }

        const rawCollections = (collectionsData ?? []) as Collection[];

        if (!cached) {
          setLoadingMessage("Loading collection content...");
        }

        /*
         * Fetch tasks + notes for EVERY
         * collection concurrently.
         *
         * No serial for-loop.
         */
        const hydratedCollections = await Promise.all(
          rawCollections.map(async (collection): Promise<Collection> => {
            try {
              const [tasksRes, notesRes] = await Promise.all([
                apiFetch(
                  `/api/tasks?collection_id=${collection.id}&is_deleted=false&is_completed=false`,
                ),

                apiFetch(
                  `/api/notes?collection_id=${collection.id}&is_deleted=false`,
                ),
              ]);

              let tasks: Task[] = [];

              let notes: Note[] = [];

              if (tasksRes.ok) {
                const result = await tasksRes.json();

                tasks = sortRows((result.data ?? []) as Task[]);
              } else {
                console.error(
                  `Failed to fetch tasks for collection ${collection.id}`,
                );
              }

              if (notesRes.ok) {
                const result = await notesRes.json();

                notes = sortRows((result.data ?? []) as Note[]);
              } else {
                console.error(
                  `Failed to fetch notes for collection ${collection.id}`,
                );
              }

              return {
                ...collection,
                tasks,
                notes,
                isPinned: false,

                is_default: isGeneralCollection(collection.collection_name),
              };
            } catch (collectionError) {
              console.error(
                `Failed to hydrate collection ${collection.id}:`,
                collectionError,
              );

              /*
               * Preserve cached content for
               * this collection if available.
               */
              const oldCollection = cached?.collections.find(
                (item) => item.id === collection.id,
              );

              return {
                ...collection,

                tasks: oldCollection?.tasks ?? [],

                notes: oldCollection?.notes ?? [],

                isPinned: false,

                is_default: isGeneralCollection(collection.collection_name),
              };
            }
          }),
        );

        if (cancelled) {
          return;
        }

        const finalList = fetchedList as List;

        setListData(finalList);

        setCollections(hydratedCollections);

        setError(null);

        writeListCache(listId, finalList, hydratedCollections);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Error fetching List Detail:", error);

        /*
         * If cache exists, keep showing
         * it. A background refresh error
         * should not destroy usable UI.
         */
        if (!cached) {
          setError(
            error instanceof Error ? error.message : "An error occurred",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchWebListData();

    return () => {
      cancelled = true;
    };
  }, [listId, user, revalidationTrigger, isGeneralCollection, sortRows]);

  /* =======================================================
     QUIET REVALIDATE

     Does NOT set isLoading(true).
     ======================================================= */

  const revalidateData = useCallback(() => {
    setRevalidationTrigger((previous) => previous + 1);

    if (IS_NATIVE_BUILD) {
      void appData?.refresh();
    }
  }, [appData]);

  /* =======================================================
     LIST UPDATED EVENT

     Update known list colour immediately.

     Then quietly revalidate instead of
     displaying the loading screen.
     ======================================================= */

  useEffect(() => {
    const handleListUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        listId: string;
        newColor?: string;
        newName?: string;
      }>;

      const {
        listId: updatedListId,
        newColor,
        newName,
      } = customEvent.detail ?? {};

      if (updatedListId !== listId) {
        return;
      }

      setListData((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,

          ...(newColor
            ? {
                bg_color_hex: newColor,
              }
            : {}),

          ...(newName
            ? {
                list_name: newName,
              }
            : {}),
        };
      });

      revalidateData();
    };

    window.addEventListener("listUpdated", handleListUpdated);

    return () => {
      window.removeEventListener("listUpdated", handleListUpdated);
    };
  }, [listId, revalidateData]);

  /* =======================================================
     EDIT COLLECTION
     ======================================================= */

  const handleEditCollection = useCallback(async (collection: Collection) => {
    setCollectionToEdit(collection);

    setIsEditCollectionModalOpen(true);

    return {
      success: true,
    };
  }, []);

  /* =======================================================
     COLLECTION EDIT SUBMIT

     EditCollectionPopup already performs
     the server operation.

     We only update local state here.

     NO complete List Detail refetch.
     ======================================================= */

  const handleEditCollectionSubmit = useCallback(
    async (
      collectionId: string,

      collectionData: {
        collection_name: string;
        bg_color_hex: string;
      },
    ): Promise<{
      success: boolean;
      error?: unknown;
    }> => {
      try {
        updateCollections((previous) =>
          previous.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,

                  collection_name: collectionData.collection_name,

                  bg_color_hex: collectionData.bg_color_hex,

                  is_default: isGeneralCollection(
                    collectionData.collection_name,
                  ),
                }
              : collection,
          ),
        );

        setIsEditCollectionModalOpen(false);

        setCollectionToEdit(null);

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error handling collection edit:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [updateCollections, isGeneralCollection],
  );

  /* =======================================================
     CREATE COLLECTION
     ======================================================= */

  const handleCreateCollection = useCallback(
    async (collectionData: {
      collection_name: string;
      bg_color_hex: string;
    }) => {
      if (!listData || !user) {
        return {
          success: false,
          error: "Missing list data or user",
        };
      }

      try {
        const res = await apiFetch("/api/collections", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            list_id: listData.id,

            collection_name: collectionData.collection_name,

            bg_color_hex: collectionData.bg_color_hex,

            created_at: formatDateForPostgres(new Date()),
          }),
        });

        if (!res.ok) {
          const errData = await res.json();

          throw new Error(errData.error || "Failed to create collection");
        }

        const { data } = await res.json();

        if (!data) {
          return {
            success: false,
            error: "No data returned from creation",
          };
        }

        const newCollection: Collection = {
          ...(data as Collection),

          tasks: [],
          notes: [],
          isPinned: false,

          is_default: isGeneralCollection(collectionData.collection_name),
        };

        updateCollections((previous) => [...previous, newCollection]);

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error creating collection:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [listData, user, isGeneralCollection, updateCollections],
  );

  /* =======================================================
     CREATE TASK
     ======================================================= */

  const handleTaskSubmit = useCallback(
    async (taskData: {
      text: string;
      description: string;
      is_pinned: boolean;
      due_date?: Date;
      collection_id?: string;
    }) => {
      if (!listData || !user) {
        return {
          success: false,
          error: "Missing list data or user",
        };
      }

      try {
        const collectionId =
          taskData.collection_id || selectedCollectionId || defaultCollectionId;

        if (!collectionId) {
          return {
            success: false,
            error: "No collection available",
          };
        }

        const res = await apiFetch("/api/tasks", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            text: taskData.text,

            description: taskData.description || null,

            is_pinned: taskData.is_pinned || false,

            due_date: taskData.due_date
              ? formatDateForPostgres(taskData.due_date)
              : null,

            collection_id: collectionId,

            list_id: listData.id,

            is_completed: false,

            is_deleted: false,

            created_at: formatDateForPostgres(new Date()),
          }),
        });

        if (!res.ok) {
          const errData = await res.json();

          throw new Error(errData.error || "Failed to create task");
        }

        const { data } = await res.json();

        if (!data) {
          return {
            success: false,
            error: "No data returned from creation",
          };
        }

        const newTask = data as Task;

        if (newTask.collection_id) {
          updateCollections((previous) =>
            previous.map((collection) =>
              collection.id === newTask.collection_id
                ? {
                    ...collection,

                    tasks: sortRows([newTask, ...(collection.tasks ?? [])]),
                  }
                : collection,
            ),
          );
        }

        setSelectedCollectionId(null);

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error creating task:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [
      listData,
      user,
      selectedCollectionId,
      defaultCollectionId,
      updateCollections,
      sortRows,
    ],
  );

  /* =======================================================
     COMPLETE TASK
     ======================================================= */

  const handleTaskComplete = useCallback(
    async (taskId: string, isCompleted: boolean) => {
      try {
        /*
         * What a completion writes is
         * decided in one place, so the
         * three write paths cannot
         * disagree about the flag or
         * the timestamp format.
         */
        const completion = applyCompletion({}, isCompleted);

        const res = await apiFetch("/api/tasks", {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id: taskId,

            is_completed: completion.is_completed,

            date_completed: completion.date_completed,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();

          throw new Error(errData.error || "Failed to update task");
        }

        const { data: updatedTask } = await res.json();

        if (!updatedTask) {
          return {
            success: false,
            error: "No data returned from update",
          };
        }

        /*
         * Completed tasks don't belong
         * in this List Detail view.
         */
        if (isCompleted) {
          updateCollections((previous) =>
            previous.map((collection) => ({
              ...collection,

              tasks: (collection.tasks ?? []).filter(
                (task) => task.id !== taskId,
              ),
            })),
          );
        } else {
          updateCollections((previous) =>
            previous.map((collection) =>
              collection.id === (updatedTask as Task).collection_id
                ? {
                    ...collection,

                    tasks: (collection.tasks ?? []).map((task) =>
                      task.id === taskId
                        ? ({
                            ...task,

                            ...updatedTask,
                          } as Task)
                        : task,
                    ),
                  }
                : collection,
            ),
          );
        }

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error completing task:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [updateCollections],
  );

  /* =======================================================
     TASK PRIORITY
     ======================================================= */

  const handleTaskPriority = useCallback(
    async (taskId: string, isPinned: boolean) => {
      try {
        const res = await apiFetch("/api/tasks", {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id: taskId,
            is_pinned: isPinned,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();

          throw new Error(errData.error || "Failed to update task");
        }

        const { data: updatedTask } = await res.json();

        if (!updatedTask) {
          return {
            success: false,
            error: "No data returned from update",
          };
        }

        updateCollections((previous) =>
          previous.map((collection) => {
            if (collection.id !== (updatedTask as Task).collection_id) {
              return collection;
            }

            const nextTasks = (collection.tasks ?? []).map((task) =>
              task.id === taskId
                ? ({
                    ...task,
                    ...updatedTask,
                    is_pinned: isPinned,
                  } as Task)
                : task,
            );

            return {
              ...collection,
              tasks: sortRows(nextTasks),
            };
          }),
        );

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error updating task priority:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [updateCollections, sortRows],
  );

  /* =======================================================
     UPDATE TASK
     ======================================================= */

  const handleTaskUpdate = useCallback(
    async (
      taskId: string,

      taskData: {
        text: string;
        description?: string | null;
        due_date?: Date | null;
        is_pinned: boolean;
      },
    ) => {
      try {
        const res = await apiFetch("/api/tasks", {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id: taskId,

            text: taskData.text,

            description: taskData.description ?? null,

            due_date: taskData.due_date
              ? formatDateForPostgres(taskData.due_date)
              : null,

            is_pinned: taskData.is_pinned,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();

          throw new Error(errData.error || "Failed to update task");
        }

        const { data: updatedTask } = await res.json();

        if (!updatedTask) {
          return {
            success: false,
            error: "No data returned from update",
          };
        }

        updateCollections((previous) =>
          previous.map((collection) => {
            if (collection.id !== (updatedTask as Task).collection_id) {
              return collection;
            }

            return {
              ...collection,

              tasks: sortRows(
                (collection.tasks ?? []).map((task) =>
                  task.id === taskId ? (updatedTask as Task) : task,
                ),
              ),
            };
          }),
        );

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error updating task:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [updateCollections, sortRows],
  );

  /* =======================================================
     DELETE TASK
     ======================================================= */

  const handleTaskDeleteWithUIUpdate = useCallback(
    async (taskId: string) => {
      try {
        const result = await handleTaskDelete(taskId);

        if (!result.success) {
          throw result.error;
        }

        updateCollections((previous) =>
          previous.map((collection) => ({
            ...collection,

            tasks: (collection.tasks ?? []).filter(
              (task) => task.id !== taskId,
            ),
          })),
        );

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error handling task deletion:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [updateCollections],
  );

  /* =======================================================
     CREATE NOTE
     ======================================================= */

  const handleNoteSubmit = useCallback(
    async (
      noteData: {
        title: string;
        description?: string;
        bg_color_hex: string;
        collection_id?: string;
      },

      newNoteData?: Note,
    ) => {
      if (!listData || !user) {
        return {
          success: false,
          error: "Missing list data or user",
        };
      }

      try {
        /*
         * Some versions of NotePopup
         * already create the note and
         * return it here.
         */
        if (newNoteData) {
          if (newNoteData.collection_id) {
            updateCollections((previous) =>
              previous.map((collection) =>
                collection.id === newNoteData.collection_id
                  ? {
                      ...collection,

                      notes: sortRows([
                        newNoteData,

                        ...(collection.notes ?? []),
                      ]),
                    }
                  : collection,
              ),
            );
          }

          setSelectedCollectionId(null);

          return {
            success: true,
          };
        }

        const collectionId =
          noteData.collection_id || selectedCollectionId || defaultCollectionId;

        if (!collectionId) {
          return {
            success: false,
            error: "No collection available",
          };
        }

        const res = await apiFetch("/api/notes", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title: noteData.title,

            description: noteData.description || null,

            bg_color_hex: noteData.bg_color_hex,

            collection_id: collectionId,

            list_id: listData.id,

            is_deleted: false,

            is_pinned: false,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();

          throw new Error(errData.error || "Failed to create note");
        }

        const { data } = await res.json();

        if (!data) {
          return {
            success: false,
            error: "No data returned from creation",
          };
        }

        const newNote = data as Note;

        if (newNote.collection_id) {
          updateCollections((previous) =>
            previous.map((collection) =>
              collection.id === newNote.collection_id
                ? {
                    ...collection,

                    notes: sortRows([newNote, ...(collection.notes ?? [])]),
                  }
                : collection,
            ),
          );
        }

        setSelectedCollectionId(null);

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error creating note:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [
      listData,
      user,
      selectedCollectionId,
      defaultCollectionId,
      updateCollections,
      sortRows,
    ],
  );

  /* =======================================================
     NOTE PIN
     ======================================================= */

  const handleNotePin = useCallback(
    async (noteId: string, isPinned: boolean) => {
      try {
        const res = await apiFetch("/api/notes", {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id: noteId,

            is_pinned: isPinned,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();

          throw new Error(errData.error || "Failed to update note");
        }

        const { data: updatedNote } = await res.json();

        if (!updatedNote) {
          return {
            success: false,
            error: "No data returned from update",
          };
        }

        updateCollections((previous) =>
          previous.map((collection) => {
            if (collection.id !== (updatedNote as Note).collection_id) {
              return collection;
            }

            return {
              ...collection,

              notes: sortRows(
                (collection.notes ?? []).map((note) =>
                  note.id === noteId
                    ? ({
                        ...note,
                        ...updatedNote,
                        is_pinned: isPinned,
                      } as Note)
                    : note,
                ),
              ),
            };
          }),
        );

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error updating note pin status:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [updateCollections, sortRows],
  );

  /* =======================================================
     NOTE COLOUR
     ======================================================= */

  const handleNoteColorChange = useCallback(
    async (noteId: string, color: string) => {
      try {
        const res = await apiFetch("/api/notes", {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id: noteId,

            bg_color_hex: color,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();

          throw new Error(errData.error || "Failed to update note");
        }

        const { data: updatedNote } = await res.json();

        if (!updatedNote) {
          return {
            success: false,
            error: "No data returned from update",
          };
        }

        updateCollections((previous) =>
          previous.map((collection) =>
            collection.id === (updatedNote as Note).collection_id
              ? {
                  ...collection,

                  notes: (collection.notes ?? []).map((note) =>
                    note.id === noteId
                      ? ({
                          ...note,
                          ...updatedNote,
                          bg_color_hex: color,
                        } as Note)
                      : note,
                  ),
                }
              : collection,
          ),
        );

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error updating note color:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [updateCollections],
  );

  /* =======================================================
     UPDATE NOTE

     IMPORTANT:
     Old version called refreshData() here.

     Removed.

     The returned note is enough to update
     the exact item locally.
     ======================================================= */

  const handleNoteUpdate = useCallback(
    async (
      noteId: string,
      updatedTitle: string,
      updatedDescription?: string,
    ) => {
      try {
        const updateData: {
          title: string;
          description?: string | null;
        } = {
          title: updatedTitle,
        };

        if (updatedDescription !== undefined) {
          updateData.description = updatedDescription || null;
        }

        const res = await apiFetch("/api/notes", {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id: noteId,
            ...updateData,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();

          throw new Error(errData.error || "Failed to update note");
        }

        const { data: updatedNote } = await res.json();

        if (!updatedNote) {
          return {
            success: false,
            error: "No data returned from update",
          };
        }

        updateCollections((previous) =>
          previous.map((collection) =>
            collection.id === (updatedNote as Note).collection_id
              ? {
                  ...collection,

                  notes: (collection.notes ?? []).map((note) =>
                    note.id === noteId ? (updatedNote as Note) : note,
                  ),
                }
              : collection,
          ),
        );

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error updating note:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [updateCollections],
  );

  /* =======================================================
     MOVE TASK
     ======================================================= */

  const handleTaskCollectionChange = useCallback(
    async (
      taskId: string,
      newCollectionId: string,
    ): Promise<OperationResult> => {
      try {
        let taskToMove: Task | null = null;

        let oldCollectionId: string | null = null;

        for (const collection of collections) {
          const foundTask = collection.tasks?.find(
            (task) => task.id === taskId,
          );

          if (foundTask) {
            taskToMove = {
              ...foundTask,
            };

            oldCollectionId = collection.id;

            break;
          }
        }

        if (!taskToMove) {
          return {
            success: false,
            error: "Task not found",
          };
        }

        const res = await apiFetch("/api/tasks", {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id: taskId,

            collection_id: newCollectionId,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();

          throw new Error(errData.error || "Failed to update task collection");
        }

        const { data: serverTask } = await res.json();

        const movedTask: Task = serverTask
          ? (serverTask as Task)
          : ({
              ...taskToMove,

              collection_id: newCollectionId,
            } as Task);

        updateCollections((previous) =>
          previous.map((collection) => {
            /*
             * Remove from old collection.
             */
            if (collection.id === oldCollectionId) {
              return {
                ...collection,

                tasks: (collection.tasks ?? []).filter(
                  (task) => task.id !== taskId,
                ),
              };
            }

            /*
             * Add to new collection.
             */
            if (collection.id === newCollectionId) {
              return {
                ...collection,

                tasks: sortRows([
                  movedTask,

                  ...(collection.tasks ?? []).filter(
                    (task) => task.id !== taskId,
                  ),
                ]),
              };
            }

            return collection;
          }),
        );

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error changing task collection:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [collections, updateCollections, sortRows],
  );

  /* =======================================================
     DELETE NOTE

     Old behaviour:
       delete
       -> local update
       -> wait 500ms
       -> refetch entire page

     New behaviour:
       delete
       -> local/cache update
       -> finished
     ======================================================= */

  const handleNoteDelete = useCallback(
    async (noteId: string) => {
      try {
        const res = await apiFetch("/api/notes", {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id: noteId,
            hard: true,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();

          throw new Error(errData.error || "Failed to delete note");
        }

        updateCollections((previous) =>
          previous.map((collection) => ({
            ...collection,

            notes: (collection.notes ?? []).filter(
              (note) => note.id !== noteId,
            ),
          })),
        );

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error deleting note:", error);

        return {
          success: false,
          error,
        };
      }
    },
    [updateCollections],
  );

  /* =======================================================
     COLLECTIONS DELETED

     The delete modal currently only tells this
     component that deletion happened; it does
     not return the deleted IDs.

     Therefore we quietly revalidate here.

     Crucially this DOES NOT show the loading
     screen or clear existing content.
     ======================================================= */

  const handleCollectionsDeleted = useCallback(() => {
    revalidateData();
  }, [revalidateData]);

  /*
   * Which collection holds the task a reminder was tapped for.
   *
   * Resolved from the loaded collections rather than passed down, because the
   * notification only knows the task and the list. Null until the data lands,
   * so the collection opens as soon as there is something to open.
   */
  const reminderCollectionId = useMemo(() => {
    if (!reminderTaskId) return null;

    const owner = collections.find((collection) =>
      (collection.tasks ?? []).some((task) => task.id === reminderTaskId),
    );

    return owner?.id ?? null;
  }, [reminderTaskId, collections]);

  /* =======================================================
     SORT COLLECTIONS

     General first.
     Then oldest -> newest.
     ======================================================= */

  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => {
      const aGeneral = isGeneralCollection(a.collection_name);

      const bGeneral = isGeneralCollection(b.collection_name);

      if (aGeneral && !bGeneral) {
        return -1;
      }

      if (!aGeneral && bGeneral) {
        return 1;
      }

      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, [collections, isGeneralCollection]);

  /* =======================================================
     MODAL CLOSE HANDLERS
     ======================================================= */

  const handleCloseCollectionModal = useCallback(() => {
    setIsCollectionModalOpen(false);
  }, []);

  const handleCloseTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);

    setSelectedCollectionId(null);
  }, []);

  const handleCloseNoteModal = useCallback(() => {
    setIsNoteModalOpen(false);

    setSelectedCollectionId(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteCollectionModalOpen(false);
  }, []);

  const handleCloseEditCollectionModal = useCallback(() => {
    setIsEditCollectionModalOpen(false);

    setCollectionToEdit(null);
  }, []);

  /* =======================================================
     RENDER
     ======================================================= */

  /* Declared once and placed twice: inline beside the title on web, portalled
     to a floating position on native. Same element, same handlers. */
  const addMenu = (
    <ListFilterPlus
      onCollapseAll={
        collections.length > 0 ? collapseAllCollections : undefined
      }
      onCreateCollection={() => setIsCollectionModalOpen(true)}
      onCreateTask={() => {
        setSelectedCollectionId(null);
        setIsTaskModalOpen(true);
      }}
      onCreateNote={() => {
        setSelectedCollectionId(null);
        setIsNoteModalOpen(true);
      }}
      onDeleteCollections={() => setIsDeleteCollectionModalOpen(true)}
    />
  );

  return (
    <main
      className={`
        relative
        min-h-screen
        w-full
        pb-20
        transition-all
        duration-300
        ${isDark ? "text-gray-200" : "text-gray-800"}
      `}
    >
      <AppSurface />

      <div
        className={`
          box-border
          p-4
          ${IS_NATIVE_BUILD ? "pt-2" : "pt-20"}
        `}
      >
        <div className="mx-auto max-w-6xl">
          {/* ===============================================
              FIRST LOAD

              Only shown when there is no cache.
             =============================================== */}

          {isLoading && !listData ? (
            <div
              className={`
                rounded-xl
                border-l-4
                border-orange-500
                py-10
                text-center
                shadow-md
                ${
                  isDark
                    ? "bg-gray-800 text-gray-300"
                    : "bg-white/90 text-gray-500"
                }
              `}
            >
              <div className="animate-pulse">
                <p className="text-lg">{loadingMessage}</p>
              </div>
            </div>
          ) : error && !listData ? (
            /* =============================================
               HARD ERROR

               Only replaces the screen if there is
               no cached/usable list available.
               ============================================= */

            <div
              className={`
                rounded-xl
                border-l-4
                border-red-500
                py-10
                text-center
                shadow-md
                ${
                  isDark
                    ? "bg-gray-800 text-red-300"
                    : "bg-white/90 text-red-700"
                }
              `}
            >
              <p className="text-lg">{error}</p>
            </div>
          ) : listData ? (
            <>
              {/* ===========================================
                  LIST HEADER
                 =========================================== */}

              <div
                className={`
                  flex
                  items-center
                  px-4
                  ${
                    IS_NATIVE_BUILD
                      ? "mb-2 justify-end"
                      : "mb-6 justify-between"
                  }
                `}
              >
                {!IS_NATIVE_BUILD && (
                  <h1
                    className={`
                      mr-2
                      truncate
                      text-2xl
                      font-bold
                      ${isDark ? "text-gray-100" : "text-gray-800"}
                    `}
                    style={{
                      color: listData.bg_color_hex ?? "#ffffff",
                    }}
                  >
                    {listData.list_name}
                  </h1>
                )}

                {/* Web keeps the quiet icon button beside the title. On native
                    it is the screen's floating Add and belongs at the bottom,
                    which is what `ListFilterPlus` already dresses itself for —
                    it styles a filled circle and opens its menu upward "just
                    above the tab bar". Only the placement was missing, so the
                    button sat in the top corner contradicting its own menu. */}
                {!IS_NATIVE_BUILD && (
                  <div className="flex-shrink-0">{addMenu}</div>
                )}
              </div>

              {/* ===========================================
                  COLLECTIONS
                 =========================================== */}

              {collections.length === 0 ? (
                <div
                  className={`
                    rounded-xl
                    py-16
                    text-center
                    shadow-md
                    ${
                      isDark
                        ? "bg-gray-900/80 text-gray-300"
                        : "bg-white/90 text-gray-500"
                    }
                  `}
                >
                  <p className="mb-4 text-lg">
                    No collections in this list yet.
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsCollectionModalOpen(true)}
                    className={`
                      rounded-md
                      px-4
                      py-2
                      text-white
                      shadow-md
                      transition-colors
                      duration-200
                      ${
                        isDark
                          ? "bg-orange-600 hover:bg-orange-700"
                          : "bg-orange-500 hover:bg-orange-600"
                      }
                    `}
                  >
                    Create your first collection
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedCollections.map((collection) => (
                    <CollectionComponent
                      key={collection.id}
                      id={collection.id}
                      collapseNonce={collapseNonce}
                      autoExpand={collection.id === reminderCollectionId}
                      collection_name={collection.collection_name || ""}
                      bg_color_hex={collection.bg_color_hex || ""}
                      created_at={collection.created_at}
                      is_default={collection.is_default ?? false}
                      tasks={collection.tasks || []}
                      notes={collection.notes || []}
                      onTaskComplete={handleTaskComplete}
                      onTaskPriority={handleTaskPriority}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={handleTaskDeleteWithUIUpdate}
                      onCollectionChange={handleTaskCollectionChange}
                      onNotePin={handleNotePin}
                      onNoteColorChange={handleNoteColorChange}
                      onNoteUpdate={handleNoteUpdate}
                      onNoteDelete={handleNoteDelete}
                      onCollectionEdit={handleEditCollection}
                      collections={collections}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              className={`
                rounded-xl
                border-l-4
                border-orange-500
                py-10
                text-center
                shadow-md
                ${
                  isDark
                    ? "bg-gray-800 text-gray-300"
                    : "bg-white/90 text-gray-500"
                }
              `}
            >
              <p className="text-lg">List not found.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================
          MODALS
         =================================================== */}

      {listData && (
        <>
          <CreateCollectionModal
            isOpen={isCollectionModalOpen}
            onClose={handleCloseCollectionModal}
            onSubmit={handleCreateCollection}
            existingCollections={collections}
          />

          <CreateTaskModal
            isOpen={isTaskModalOpen}
            onClose={handleCloseTaskModal}
            onSubmit={handleTaskSubmit}
            collections={collections}
            selectedCollectionId={selectedCollectionId ?? undefined}
          />

          <CreateNoteModal
            isOpen={isNoteModalOpen}
            onClose={handleCloseNoteModal}
            onSubmit={handleNoteSubmit}
            collections={collections}
            listId={listId}
            selectedCollectionId={selectedCollectionId ?? undefined}
          />

          <DeleteCollectionModal
            isOpen={isDeleteCollectionModalOpen}
            onClose={handleCloseDeleteModal}
            collections={collections}
            onCollectionsDeleted={handleCollectionsDeleted}
          />

          <EditCollectionPopup
            isOpen={isEditCollectionModalOpen}
            onClose={handleCloseEditCollectionModal}
            onSubmit={handleEditCollectionSubmit}
            existingCollections={collections}
            currentCollection={collectionToEdit}
          />
        </>
      )}

      {/* The floating Add, on native only.

          Portalled to the body, and that is not optional: NativeTransition wraps
          this screen in a `transform`, which makes it the containing block for
          any `position: fixed` child. Rendered in place the button measures
          itself against the transition wrapper rather than the viewport. The
          same trap NativeHome and the detail sheets documented.

          `pb-20` on <main> already reserves the room, so nothing rests under it. */}
      {IS_NATIVE_BUILD &&
        portalReady &&
        !isLoading &&
        listData &&
        createPortal(
          <div
            className="fixed right-5 z-40"
            style={{ bottom: "calc(56px + var(--safe-bottom) + 4px)" }}
          >
            {addMenu}
          </div>,
          document.body,
        )}
    </main>
  );
}
