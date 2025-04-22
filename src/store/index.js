// the state for everywhere
// you can call it by this.$store on .vue file without import it
// ex. this.$store.busList
// you can call it in .js file too! by import store from "@/store"
// ex. store.busList

// import the createStore
import { createStore } from "vuex";
// import the plugin for saving the store to localStorage! VERY GOOD
// import createPersistedState from "vuex-persistedstate";
import localforage from "localforage";

const store = createStore({
  // the state
  state: {
    version: "1A09",

    lang: "zhHK",
    timerSwitch: true,
    darkMode: true,

    busList: {},
    stopsList: [],

    lastUpd: {
      busList: null,
      stopsList: null,
    },

    profiles: [
      {
        id: 'default',
        name: 'Default',
        selected: []
      }
    ],
    currentProfileId: 'default'
  },
  // you can implement some function to help you set the state
  // call it using
  // ex. this.$store.commit("setBusList") or store.commit("setBusList")
  // or you can also just set it normally
  // ex. this.$store.busList = "abc" or store.busList = "abc"
  mutations: {
    setVersion(state,val){
      state.version = val
    },
    setLang(state, val) {
      state.lang = val;
    },
    setTimerSwitch(state, val) {
      state.timerSwitch = val;
    },
    invertDarkMode(state) {
      state.darkMode = !state.darkMode;
    },
    setBusList(state, val) {
      state.busList = val;
    },
    setStopsList(state, val) {
      state.stopsList = val;
    },
    setLastUpdBusList(state, val) {
      state.lastUpd.busList = val;
    },
    setLastUpdStopsList(state, val) {
      state.lastUpd.stopsList = val;
    },

    addSelected(state, val) {
      const currentProfile = state.profiles.find(p => p.id === state.currentProfileId);
      if (
        currentProfile.selected.find(
          (e) =>
            e.routeStop[0].route == val.routeStop[0].route &&
            e.routeStop[0].bound == val.routeStop[0].bound &&
            e.routeStop[0].service_type == val.routeStop[0].service_type &&
            e.routeStop[0].seq == val.routeStop[0].seq
        ) == null
      ) {
        currentProfile.selected.push(JSON.parse(JSON.stringify(val)));
        val.success = true;
      }
    },
    removeSelected(state, index) {
      const currentProfile = state.profiles.find(p => p.id === state.currentProfileId);
      currentProfile.selected.splice(index, 1);
    },
    invertCollapseSelected(state, index){
      const currentProfile = state.profiles.find(p => p.id === state.currentProfileId);
      currentProfile.selected[index].collapse = !currentProfile.selected[index].collapse;
    },
    addProfile(state, name) {
      const id = 'profile-' + Date.now();
      state.profiles.push({
        id,
        name,
        selected: []
      });
      state.currentProfileId = id;
    },
    removeProfile(state, id) {
      if (id === 'default') return; // Prevent removing default profile
      const index = state.profiles.findIndex(p => p.id === id);
      if (index !== -1) {
        state.profiles.splice(index, 1);
        if (state.currentProfileId === id) {
          state.currentProfileId = 'default';
        }
      }
    },
    renameProfile(state, { id, name }) {
      const profile = state.profiles.find(p => p.id === id);
      if (profile) {
        profile.name = name;
      }
    },
    reorderProfiles(state, { fromIndex, toIndex }) {
      // Don't allow reordering the default profile
      if (fromIndex === 0 || toIndex === 0) return;
      
      const profiles = [...state.profiles];
      const [movedProfile] = profiles.splice(fromIndex, 1);
      profiles.splice(toIndex, 0, movedProfile);
      state.profiles = profiles;
    },
    setCurrentProfile(state, id) {
      state.currentProfileId = id;
    }
  },
});

// Handle version migration
store.watch(
  (state) => state,
  async (newState) => {
    // Save to localforage
    await localforage.setItem("state", JSON.parse(JSON.stringify(newState)));
  },
  {
    deep: true,
  }
);

// Handle initial state load and migration
const initStore = async () => {
  const savedState = await localforage.getItem("state");
  
  if (savedState) {
    if (savedState.version === "1A08") {
      // Migrate from 1A08 to 1A09
      const migratedState = {
        ...savedState,
        version: "1A09",
        profiles: [
          {
            id: 'default',
            name: 'Default',
            selected: savedState.selected || []
          }
        ],
        currentProfileId: 'default'
      };
      
      // Remove the old selected array since it's now part of profiles
      delete migratedState.selected;
      
      store.replaceState(migratedState);
      await localforage.setItem("state", JSON.parse(JSON.stringify(migratedState)));
    } else if (savedState.version === "1A09") {
      store.replaceState(savedState);
    } else {
      // If version is not recognized, reset to default state
      await localforage.setItem("state", JSON.parse(JSON.stringify(store.state)));
    }
  }
};

initStore();

export default store;
