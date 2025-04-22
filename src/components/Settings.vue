<template>
  <n-space vertical style="padding: 20px">
    <div ref="listRef">
      <n-space vertical>
        <n-card v-for="profile in nonDefaultProfiles" :key="profile.id" size="small" class="profile-card">
          <template #header>
            <n-space justify="space-between" align="center" style="width: 100%">
              <n-space align="center">
                <n-icon class="drag-handle"><drag /></n-icon>
                <span>{{ profile.name }}</span>
              </n-space>
              <n-space>
                <n-button text @click="handleRename(profile)">
                  <template #icon>
                    <n-icon><create-outline /></n-icon>
                  </template>
                </n-button>
                <n-button text @click="handleTabClose(profile.id)">
                  <template #icon>
                    <n-icon><trash /></n-icon>
                  </template>
                </n-button>
              </n-space>
            </n-space>
          </template>
        </n-card>
      </n-space>
    </div>
  </n-space>
</template>

<script>
import { CreateOutline, Trash, Drag } from "@vicons/ionicons5";
import { useDialog, NInput } from "naive-ui";
import { h, ref, onMounted, onUnmounted } from "vue";
import Sortable from "sortablejs";
import store from "@/store";

export default {
  components: {
    CreateOutline,
    Trash,
    Drag,
  },
  setup() {
    const dialog = useDialog();
    const listRef = ref(null);
    let sortable = null;

    onMounted(() => {
      if (listRef.value) {
        sortable = new Sortable(listRef.value, {
          animation: 150,
          handle: ".drag-handle",
          onEnd: (evt) => {
            // Add 1 to account for the default profile
            const fromIndex = evt.oldIndex + 1;
            const toIndex = evt.newIndex + 1;
            store.commit("reorderProfiles", { fromIndex, toIndex });
          },
        });
      }
    });

    onUnmounted(() => {
      if (sortable) {
        sortable.destroy();
      }
    });

    return {
      dialog,
      listRef,
    };
  },
  computed: {
    profiles() {
      return this.$store.state.profiles;
    },
    nonDefaultProfiles() {
      return this.profiles.filter((p) => p.id !== "default");
    },
  },
  methods: {
    handleTabClose(name) {
      this.$store.commit("removeProfile", name);
    },
    handleRename(profile) {
      const inputRef = ref(profile.name);

      this.dialog.create({
        title: this.$t("profile.rename"),
        content: () => {
          return h(NInput, {
            value: inputRef.value,
            onUpdateValue: (value) => {
              inputRef.value = value;
            },
            placeholder: this.$t("profile.name"),
            onKeydown: (e) => {
              if (e.key === "Enter") {
                if (inputRef.value) {
                  this.$store.commit("renameProfile", {
                    id: profile.id,
                    name: inputRef.value,
                  });
                  this.dialog.destroyAll();
                }
              }
            },
          });
        },
        positiveText: this.$t("confirm"),
        negativeText: this.$t("cancel"),
        onPositiveClick: () => {
          if (inputRef.value) {
            this.$store.commit("renameProfile", {
              id: profile.id,
              name: inputRef.value,
            });
            return true;
          }
          return false;
        },
      });
    },
  },
};
</script>

<style scoped>
.profile-card {
  cursor: move;
}

.drag-handle {
  cursor: move;
}
</style>