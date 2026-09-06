import { ref, computed } from 'vue'

const STORAGE_KEY = 'travel_favorites'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function save(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

const ids = ref(load())
const idSet = computed(() => new Set(ids.value))

export function useFavorites() {
  function toggle(productId) {
    const set = new Set(ids.value)
    if (set.has(productId)) {
      set.delete(productId)
    } else {
      set.add(productId)
    }
    ids.value = [...set]
    save(ids.value)
  }

  function isFav(productId) {
    return idSet.value.has(productId)
  }

  function clear() {
    ids.value = []
    save([])
  }

  return { ids, isFav, toggle, clear }
}
