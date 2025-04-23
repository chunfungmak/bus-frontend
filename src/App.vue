<template>
  <!-- this is the warpper from naive-ui (components that have n- prefix is from naive-ui also) -->
  <!-- for more info abt naive-ui please read: https://www.naiveui.com/ -->
  <!-- <n-loading-bar-provider> -->
  <n-config-provider :theme="theme">
    <n-dialog-provider>
      <n-space vertical size="large">
        <n-layout>
          <n-layout-header>
            <Nav />
          </n-layout-header>
          <n-layout-content content-style="padding: .5rem;">
            <ProfileTabs>
              <Bus />
            </ProfileTabs>
          </n-layout-content>
        </n-layout>
      </n-space>

      <!-- this can help the body also have dark mode -->
      <n-global-style />
    </n-dialog-provider>
  </n-config-provider>
  <!-- </n-loading-bar-provider> -->
</template>

<script>
// import my custom component
import Bus from "@/components/Bus.vue";
import Nav from "@/components/Nav.vue";
import ProfileTabs from "@/components/ProfileTabs.vue";

import { ElLoading } from "element-plus";

// this is the stuff for naive-ui darkTheme!
import { darkTheme } from "naive-ui";

import { computed } from 'vue';

export default {
  // import my custom component to use inside current components (the top template area)
  components: {
    Bus,
    Nav,
    ProfileTabs,
  },
  // this place is define the data (state) on this component
  data() {
    return {
      version: "1.1.0",
      loading: null,
      // this is the stuff for naive-ui darkTheme!
      darkTheme,
      theme: this.$store.state.darkMode ? darkTheme : null,
      // Add geolocation state
      userLocation: null,
      locationError: null,
      locationWatchId: null,
    };
  },
  created() {
    this.loading = ElLoading.service({
      lock: true,
      text: this.$t("loading"),
      background: "rgba(0, 0, 0, 0.7)",
    });
    // Start watching location when app is created
    this.startLocationWatch();
  },
  methods: {
    setStatus(status) {
      this.loading.setText(this.$t("loading") + (status ? " " + status : ""));
    },
    startLocationWatch() {
      if (navigator.geolocation) {
        navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            this.initializeGeolocation();
          } else if (permissionStatus.state === 'prompt') {
            this.initializeGeolocation();
          } else {
            this.locationError = 'Geolocation permission denied';
            console.error('Geolocation permission denied');
          }

          permissionStatus.addEventListener('change', () => {
            if (permissionStatus.state === 'granted') {
              this.initializeGeolocation();
            } else {
              this.locationError = 'Geolocation permission denied';
              console.error('Geolocation permission denied');
              this.stopLocationWatch();
            }
          });
        });
      }
    },
    initializeGeolocation() {
      this.locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.locationError = null;
        },
        (error) => {
          this.locationError = error.message;
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    },
    stopLocationWatch() {
      if (this.locationWatchId) {
        navigator.geolocation.clearWatch(this.locationWatchId);
        this.locationWatchId = null;
      }
    }
  },
  provide() {
    return {
      userLocation: computed(() => this.userLocation),
      locationError: computed(() => this.locationError)
    };
  },
  beforeUnmount() {
    this.stopLocationWatch();
  },
  watch: {
    "$store.state.darkMode": function (val) {
      this.theme = val ? darkTheme : null;
    },
  },
};
</script>

<style scoped>
/* some style for everywhere */
/* if you just want style only for this component, use <style scoped> */
* {
  touch-action: manipulation;
}

.n-layout-header {
  padding: 0 1rem;
  font-size: 1.5rem;
}
</style>
