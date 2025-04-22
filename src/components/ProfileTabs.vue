<template>
  <n-tabs
    type="card"
    v-model:value="currentProfileId"
    @update:value="handleTabChange"
    closable
    @close="handleTabClose"
  >
    <n-tab-pane
      v-for="profile in profiles"
      :key="profile.id"
      :name="profile.id"
      :tab="profile.name"
      :closable="profile.id !== 'default' && profile.id === currentProfileId"
    >
      <template #tab>
        <n-space align="center" justify="center">
          <div>
            {{ profile.id === "default" ? this.$t("default") : profile.name }}
          </div>
          <div style="display: flex;" v-if="profile.id !== 'default' && profile.id === currentProfileId">
            <n-button
              text
              style="font-size: 10px;"
              @click.stop="handleRename(profile)"
            >
              <template #icon>
                <n-icon><create-outline /></n-icon>
              </template>
            </n-button>
          </div>
        </n-space>
      </template>
    </n-tab-pane>
    <template #prefix>
      <n-button text @click="handleTabAdd">
        <template #icon>
          <n-icon><add /></n-icon>
        </template>
      </n-button>
    </template>
  </n-tabs>
</template>

<script>
import { Add, CreateOutline } from "@vicons/ionicons5";
import { useDialog, NInput } from "naive-ui";
import { h, ref } from "vue";

export default {
  components: {
    Add,
    CreateOutline,
  },
  setup() {
    const dialog = useDialog();
    return {
      dialog,
    };
  },
  computed: {
    profiles() {
      return this.$store.state.profiles;
    },
    currentProfileId: {
      get() {
        return this.$store.state.currentProfileId;
      },
      set(value) {
        this.$store.commit("setCurrentProfile", value);
      },
    },
  },
  methods: {
    handleTabChange(value) {
      this.$store.commit("setCurrentProfile", value);
    },
    handleTabClose(name) {
      this.$store.commit("removeProfile", name);
    },
    handleTabAdd() {
      const inputRef = ref("");

      this.dialog.create({
        title: this.$t("profile.add"),
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
                  this.$store.commit("addProfile", inputRef.value);
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
            this.$store.commit("addProfile", inputRef.value);
            return true;
          }
          return false;
        },
      });
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
