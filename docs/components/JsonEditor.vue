<template>
  <div ref="editorContainer" class="json-editor-container border rounded-md overflow-hidden"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'

// Define props
interface Props {
  modelValue?: Record<string, any> | any[]
  mode?: 'tree' | 'view' | 'form' | 'code' | 'text'
  modes?: ('tree' | 'view' | 'form' | 'code' | 'text')[]
  height?: string
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  mode: 'tree',
  modes: () => ['tree', 'code', 'text'],
  height: '400px',
  readOnly: false
})

// Define emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any> | any[]): void
}>()

// Refs
const editorContainer = ref<HTMLElement | null>(null)
let editor: JSONEditor | null = null

// Initialize editor
const initEditor = () => {
  if (!editorContainer.value) return

  const options = {
    mode: props.mode,
    modes: props.modes,
    navigationBar: false,
    statusBar: false,
    readOnly: props.readOnly,
    onChange: () => {
      if (editor) {
        try {
          const json = editor.get()
          emit('update:modelValue', json)
        } catch (error) {
          // Ignore parsing errors
        }
      }
    }
  }

  editor = new JSONEditor(editorContainer.value, options)
  
  // Set initial value
  if (props.modelValue) {
    editor.set(props.modelValue)
  }
  
  // Set height
  if (editorContainer.value) {
    editorContainer.value.style.height = props.height
  }
}

// Watch for changes in modelValue
watch(() => props.modelValue, (newValue) => {
  if (editor) {
    // Only update if the value has actually changed
    const currentJson = editor.get()
    if (JSON.stringify(currentJson) !== JSON.stringify(newValue)) {
      editor.set(newValue || {})
    }
  }
}, { deep: true })

// Lifecycle hooks
onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  if (editor) {
    editor.destroy()
    editor = null
  }
})

// Expose methods
defineExpose({
  expandAll: () => editor?.expandAll(),
  collapseAll: () => editor?.collapseAll()
})
</script>

<style scoped>
.json-editor-container {
  width: 100%;
}
</style>