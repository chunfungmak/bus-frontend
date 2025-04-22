<template>
  <div class="profile-tabs">
    <n-tabs
      v-model:value="currentTab"
      type="card"
      closable
      @close="handleClose"
      @update:value="handleTabChange"
    >
      <template #prefix>
        <n-button text @click="handleAddProfile">
          <template #icon>
            <n-icon><AddIcon /></n-icon>
          </template>
        </n-button>
      </template>
      <!-- Profile Tabs -->
      <n-tab-pane
        v-for="profile in profiles"
        :key="profile.id"
        :name="profile.id"
        :tab="profile.name"
        :closable="false"
      >
        <template #tab>
          <div class="tab-content">
            <span>{{ profile.name }}</span>
          </div>
        </template>
        <slot></slot>
      </n-tab-pane>

      <!-- Settings Tab -->
      <n-tab-pane
        name="settings"
        :tab="$t('profile.settings')"
        :closable="false"
      >
        <template #tab>
          <div class="tab-content">
            <n-icon><SettingsIcon /></n-icon>
          </div>
        </template>
        <Settings />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { Settings as SettingsIcon, Add as AddIcon } from "@vicons/ionicons5";
import Sortable from "sortablejs";
import SettingsComponent from "./Settings.vue";
import { useDialog, NInput } from "naive-ui";
import { h } from "vue";
import { useI18n } from "vue-i18n";

export default {
  name: "ProfileTabs",
  components: {
    Settings: SettingsComponent,
    SettingsIcon,
    AddIcon,
  },
  setup() {
    const store = useStore();
    const dialog = useDialog();
    const { t } = useI18n();

    if (store.state.currentProfileId === "settings") {
      store.commit("setCurrentProfile", "default");
    }

    const currentTab = computed({
      get: () => store.state.currentProfileId,
      set: (value) => {
        store.commit("setCurrentProfile", value);
      },
    });
    const profiles = computed(() => store.state.profiles);

    const handleAddProfile = () => {
      const inputRef = ref("");

      dialog.create({
        title: t("profile.add"),
        content: () => {
          return h(NInput, {
            value: inputRef.value,
            onUpdateValue: (value) => {
              inputRef.value = value;
            },
            placeholder: t("profile.name"),
            onKeydown: (e) => {
              if (e.key === "Enter") {
                if (inputRef.value.trim()) {
                  store.commit("addProfile", inputRef.value.trim());
                  dialog.destroyAll();
                }
              }
            },
          });
        },
        positiveText: t("confirm"),
        negativeText: t("cancel"),
        onPositiveClick: () => {
          if (inputRef.value.trim()) {
            store.commit("addProfile", inputRef.value.trim());
            return true;
          }
          return false;
        },
      });
    };

    const handleClose = (name) => {
      if (profiles.value.length > 1) {
        store.commit("removeProfile", name);
      }
    };

    const handleTabChange = (name) => {
      store.commit("setCurrentProfile", name);
    };

    onMounted(() => {
      const el = document.querySelector(".profile-list");
      if (el) {
        new Sortable(el, {
          animation: 150,
          onEnd: (evt) => {
            const profiles = [...store.state.profiles];
            const [removed] = profiles.splice(evt.oldIndex, 1);
            profiles.splice(evt.newIndex, 0, removed);
            store.commit("reorderProfiles", profiles);
          },
        });
      }
    });

    return {
      currentTab,
      profiles,
      handleAddProfile,
      handleClose,
      handleTabChange,
    };
  },
};
</script>

<style scoped>
.profile-tabs {
  position: relative;
  margin-bottom: 20px;
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-profile-btn {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
