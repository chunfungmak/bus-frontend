<template>
  <!-- this is the custom componet -->
  <n-space vertical>
    <n-card size="small">
      <n-space vertical>
        <n-select
          filterable
          v-model:value="formData.route"
          :options="busList"
          :clearable="true"
          :placeholder="$t('r1.route')"
        />
        <n-select
          filterable
          v-model:value="formData.routeStop"
          :options="stopsList"
          :clearable="true"
          :placeholder="$t('r1.stop')"
        />

        <n-select
          filterable
          v-model:value="formData.sameRoute"
          :options="sameRoute"
          :clearable="true"
          v-if="sameRoute.length > 0"
          :placeholder="$t('r2.route')"
        />
        <n-select
          filterable
          v-model:value="formData.sameRouteStop"
          :options="sameRouteStopList"
          :clearable="true"
          v-if="sameRoute.length > 0"
          :placeholder="$t('r2.stop')"
        />

        <n-button color="#8a2be2" style="width: 100%" @click="add">
          <template #icon>
            <n-icon>
              <add />
            </n-icon>
          </template>
          {{ $t("add.bus") }}
        </n-button>
      </n-space>
    </n-card>
    <n-button
      color="#ff69b4"
      style="width: 100%"
      @click="setSelected"
      :loading="loading"
    >
      <template #icon>
        <n-icon>
          <refresh />
        </n-icon>
      </template>
      {{ $t("refresh") }}
      <span style="padding-left: 1rem; font-size: 12px">
        {{ $t("refresh.auto", { refreshCountdown }) }}
      </span>
    </n-button>
    <n-card
      size="small"
      v-for="(item, i) in selected"
      :key="i"
      closable
      @close="remove(i)"
    >
      <template #header>
        <span @click="collapse(i)">
          <n-icon size="16">
            <caret-down-sharp v-if="item.collapse" />
            <caret-up-sharp v-else />
          </n-icon>
          {{ item.route }}
        </span>
      </template>
      <n-steps
        vertical
        size="small"
        :current="item.location.seq"
        :status="'process'"
        v-if="!item.collapse"
      >
        <n-step :title="prev.label" v-for="(prev, j) in item.prev2" :key="j">
          <template #default>
            <div
              v-if="prev.fare || prev.distance"
              style="
                font-size: 13px;
                margin-bottom: 2px;
                margin-top: -5px;
                display: flex;
                gap: 5px;
              "
            >
              <span v-if="prev.fare">
                {{ this.$t("fare") }}: {{ prev.fare }}
              </span>
              <span v-if="prev.distance">
                {{ this.$t("distance") }}: {{ prev.distance }}
              </span>
            </div>
            {{
              prev.eta[0]
                ? formatLeft(prev.eta[0].time, refreshCountup) +
                  ` ${this.$t(prev.eta[0].co)} ${getLangRmk(prev.eta[0])}`
                : this.$t("status.no_bus")
            }}
          </template>
        </n-step>
        <n-step :title="item.stop">
          <template #default>
            <div
              v-if="item.fare || item.distance"
              style="
                font-size: 13px;
                margin-top: -5px;
                display: flex;
                gap: 10px;
              "
            >
              <span v-if="item.fare">
                {{ this.$t("fare") }}: {{ item.fare }}
              </span>
              <span v-if="item.distance">
                {{ this.$t("distance") }}: {{ item.distance }}
              </span>
            </div>
            <template v-if="item.eta.length == 0">
              <div style="margin-top: 3px">
                {{ this.$t("status.no_bus") }}
              </div>
            </template>
            <template v-else>
              <div style="margin-top: 10px">
                <n-timeline>
                  <n-timeline-item
                    type="success"
                    :title="formatLeft(eta.time, refreshCountup)"
                    :time="
                      formatTime(eta.time) +
                      ` ${this.$t(eta.co)} ${getLangRmk(eta)}`
                    "
                    v-for="(eta, k) in item.eta"
                    :key="k"
                  />
                </n-timeline>
              </div>
            </template>
          </template>
        </n-step>
      </n-steps>

      <!-- For Debug use -->
      <!-- <pre>
        {{ JSON.stringify(item, 0, 2) }}
        </pre> -->
    </n-card>
  </n-space>
</template>

<script>
import { Add, Refresh, CaretDownSharp, CaretUpSharp } from "@vicons/ionicons5";
import DataServices from "@/service/DataServices.js";
import {
  lang,
  formatLeft,
  formatTime,
  getBusList,
  getStopsList,
  getSameRoute,
  getLangRmk,
} from "@/service/Utils.js";
import fareData from "@/service/additional/FARE_BUS-FARE_optimized.json";
import routeData from "@/service/additional/FARE_BUS-ROUTE_optimized.json";
import stopData from "@/service/additional/STOP_BUS-STOP_optimized.json";

export default {
  components: {
    Add,
    Refresh,
    CaretDownSharp,
    CaretUpSharp,
  },
  data() {
    return {
      loading: false,

      formatLeft,
      formatTime,
      getLangRmk,

      refreshCountdown: process.env.VUE_APP_REFRESH_COUNTDOWN,
      refreshCountup: 0,
      refreshTime: new Date(),

      sameRoute: [],

      formData: {
        route: null,
        routeStop: null,
        sameRoute: null,
        sameRouteStop: null,
      },

      selected: [],

      loadingBar: null,
      fareData,
      routeData,
      stopData,
    };
  },
  // do when this component has loaded
  async mounted() {
    await DataServices.getBusList(this.$root.setStatus);
    await DataServices.getStopsList(this.$root.setStatus);

    this.$root.loading.close();

    this.setSelected();

    this.timer = setInterval(() => {
      this.refreshCountup += 1000;
      // if the device pause and re-open
      if (new Date() - this.refreshTime > 5000) this.setSelected();

      this.refreshTime = new Date();
      if (this.timerSwitch && !this.loading) {
        if (this.refreshCountdown > 0) {
          this.refreshCountdown--;
        } else {
          this.setSelected();
        }
      }
    }, 1000);
  },
  // the functions for this component
  methods: {
    add: function () {
      if (
        this.formData.routeStop != "" &&
        this.formData.routeStop != null &&
        (this.formData.sameRoute == "" ||
          this.formData.sameRoute == null ||
          ((this.formData.sameRoute != "") &
            (this.formData.sameRoute != null) &&
            (this.formData.sameRouteStop != "") &
              (this.formData.sameRouteStop != null)))
      ) {
        let added = JSON.parse(JSON.stringify(this.formData));

        added.collapse = false;
        added.co = [added.route.co];
        added.routeStop = [added.routeStop];
        if (added.sameRoute) {
          added.co.push(added.sameRoute.co);
          added.routeStop.push(added.sameRouteStop);
        }
        added.label_en = `${added.route.route_en || added.route.route}. ${
          added.route.orig_en
        } > ${added.route.dest_en} - ${added.routeStop[0].name_en}`;
        added.label_tc = `${added.route.route_tc || added.route.route}. ${
          added.route.orig_tc
        } > ${added.route.dest_tc} - ${added.routeStop[0].name_tc}`;

        added.prev2 = [];
        for (
          let i = this.formData.routeStop.seq - 1;
          this.formData.routeStop.seq - 3 < i && i > 0;
          i--
        ) {
          let toBeAdded = [this.stopsList.find((e) => e.value.seq == i)];
          if (added.sameRoute)
            toBeAdded.push(
              this.sameRouteStopList.find((e) => e.value.seq == i)
            );
          added.prev2 = [toBeAdded, ...added.prev2];
        }

        delete added.route;
        delete added.sameRoute;
        delete added.sameRouteStop;
        this.$store.commit("addSelected", added);
        if (added.success) this.formData.route = null;
        this.setSelected();
      }
    },
    remove: function (index) {
      this.$store.commit("removeSelected", index);
      this.setSelected();
    },
    collapse: function (index) {
      this.$store.commit("invertCollapseSelected", index);
      this.setSelected();
    },
    getFare: function (co, route, dir, stop) {
      let direction;
      if (co === "KMB") {
        direction = dir === "O" ? 1 : 2;
      } else {
        direction = dir === "O" ? 2 : 1;
      }
      // Find route ID from route number
      const routeInfo = this.routeData.find(
        (r) => r.R === route && r.CO.includes(co)
      );
      if (!routeInfo) return null;

      // Find fare for this route and stop
      const fareInfo = this.fareData.find(
        (f) => f.RI === routeInfo.RI && f.RS === direction && f.S === stop
      );
      return fareInfo;
    },
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Radius of the earth in km
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) *
          Math.cos(this.deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km
      return distance;
    },
    deg2rad(deg) {
      return deg * (Math.PI / 180);
    },
    updateDistances() {
      const location = this.$root.userLocation;
      if (!location) return;

      this.selected = this.selected.map((item) => {
        if (item.raw && item.raw[0]) {
          const fare = this.getFare(
            item.raw[0].co,
            item.raw[0].route,
            item.raw[0].bound,
            +item.raw[0].seq
          );
          if (fare) {
            item.distance = this.getStopDistance(fare.SI);
          }
        }
        if (item.prev2) {
          item.prev2 = item.prev2.map((prev) => {
            if (item.raw && item.raw[0]) {
              const prevFare = this.getFare(
                item.raw[0].co,
                item.raw[0].route,
                item.raw[0].bound,
                +prev.seq
              );
              if (prevFare) {
                prev.distance = this.getStopDistance(prevFare.SI);
              }
            }
            return prev;
          });
        }
        return item;
      });
    },
    getStopDistance(stopId) {
      const location = this.$root.userLocation;
      if (!location) return null;

      const stop = this.stopData.find((s) => s.I === stopId);

      if (!stop) return null;

      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        stop.X,
        stop.Y
      );

      if (distance < 1) {
        return (distance * 1000).toFixed(0) + " m";
      } else {
        return distance.toFixed(2) + " km";
      }
    },
    setSelected: async function () {
      if (this.currentProfile == null) {
        this.selected = [];
        return;
      }

      this.loading = true;

      let a = [];

      for (let j in this.currentProfile.selected) {
        let e = this.currentProfile.selected[j];
        let prev2 = [];
        let allLeft = [];
        let eta = [];
        for (let m in e.prev2) {
          let k = e.prev2[m];
          let eta = [];
          if (!e.collapse) {
            for (let o in k) {
              let oo = k[o];
              eta = [...eta, ...(await DataServices.getETA(oo.value))];
            }
          }
          eta.sort((a, b) => {
            return a.time - b.time;
          });
          allLeft.push(
            eta[0]
              ? eta[0].time - new Date() > 0
                ? eta[0].time - new Date()
                : 99999999
              : 99999999
          );

          // Get fare for the previous stop
          const prevFare = this.getFare(
            k[0].value.co,
            k[0].value.route,
            k[0].value.bound,
            +k[0].value.seq
          );

          const distance = prevFare ? this.getStopDistance(prevFare.SI) : null;

          prev2.push({
            seq: k[0].value.seq,
            label: k[0].value.label,
            eta,
            fare: prevFare ? `$${parseFloat(prevFare.P).toFixed(1)}` : null,
            distance: distance,
          });
        }
        if (!e.collapse) {
          for (let o in e.routeStop) {
            let oo = e.routeStop[o];
            eta = [...eta, ...(await DataServices.getETA(oo))];
          }
        }

        eta.sort((a, b) => {
          return a.time - b.time;
        });
        allLeft.push(
          eta[0]
            ? eta[0].time - new Date() > 0
              ? eta[0].time - new Date()
              : 99999999
            : 99999999
        );

        let label =
          e.co.map((k) => "[" + this.$t(k) + "]").join(" ") +
          ` ${e["label_" + lang[this.$store.state.lang]]}`;

        // Get fare for the current stop
        const fare = this.getFare(
          e.routeStop[0].co,
          e.routeStop[0].route,
          e.routeStop[0].bound,
          +e.routeStop[0].seq
        );

        a.push({
          collapse: e.collapse,
          raw: e.routeStop,
          seq: e.routeStop[0].seq,
          route: label,
          stop: e.routeStop[0].label,
          eta,
          prev2,
          fare: fare ? `$${parseFloat(fare.P).toFixed(1)}` : null,
          distance: fare ? this.getStopDistance(fare.SI) : null,
          location: {
            allLeft,
            seq: allLeft.indexOf(Math.min(...allLeft)) + 1,
          },
        });
      }

      this.selected = a;
      this.refreshCountup = 0;
      this.refreshCountdown = process.env.VUE_APP_REFRESH_COUNTDOWN;
      this.loading = false;
    },
  },
  // is the key (formData.route in this case) has changes do the function
  watch: {
    currentProfile: function () {
      this.selected = [];
      this.setSelected();
    },
    "formData.route": function (route) {
      this.formData.routeStop = null;
      this.sameRoute = getSameRoute(route);
      this.formData.sameRoute = null;
      this.formData.sameRouteStop = null;
    },
    stopsList: function (stopsList) {
      if (!(stopsList && this.$root.userLocation)) return;

      if (stopsList.length === 0) return;

      let nearestStop = stopsList[0];
      let minDistance = Infinity;

      for (const stop of stopsList) {
        const fareInfo = this.getFare(
          stop.value.co,
          stop.value.route,
          stop.value.bound,
          +stop.value.seq
        );
        if (!fareInfo) continue;

        const stopInfo = this.stopData.find((s) => s.I === fareInfo.SI);
        if (!stopInfo) continue;

        const distance = this.calculateDistance(
          this.$root.userLocation.lat,
          this.$root.userLocation.lng,
          stopInfo.X,
          stopInfo.Y
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestStop = stop;
        }
      }

      this.formData.routeStop = nearestStop.value;
    },
    sameRouteStopList: function (sameRouteStopList) {
      if (!(sameRouteStopList && this.$root.userLocation)) return;

      if (sameRouteStopList.length === 0) return;

      let nearestStop = sameRouteStopList[0];
      let minDistance = Infinity;

      for (const stop of sameRouteStopList) {
        const fareInfo = this.getFare(
          stop.value.co,
          stop.value.route,
          stop.value.bound,
          +stop.value.seq
        );
        if (!fareInfo) continue;

        const stopInfo = this.stopData.find((s) => s.I === fareInfo.SI);
        if (!stopInfo) continue;

        const distance = this.calculateDistance(
          this.$root.userLocation.lat,
          this.$root.userLocation.lng,
          stopInfo.X,
          stopInfo.Y
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestStop = stop;
        }
      }

      this.formData.sameRouteStop = nearestStop.value;
    },
    "$store.state.lang": function () {
      this.setSelected();
    },
    refreshCountup: function (refreshCountup) {
      this.selected.forEach((e) => {
        let allLeft = [];
        for (let m in e.prev2) {
          let left = e.prev2[m].eta[0]
            ? e.prev2[m].eta[0].left - new Date() - refreshCountup
            : 99999999;
          allLeft.push(left > 0 ? left : 99999999);
        }
        let cuurentLeft = e[0] ? e[0].left - refreshCountup : 99999999;
        allLeft.push(cuurentLeft > 0 ? cuurentLeft : 99999999);
        this.selected.location = {
          allLeft,
          seq: allLeft.indexOf(Math.min(...allLeft)) + 1,
        };
      });
    },
    "$root.userLocation": function (newLocation) {
      if (newLocation) {
        this.updateDistances();
      }
    },
  },
  // the data is computed
  // usually use for getting store state
  // it has get() and set(val) fn
  computed: {
    timerSwitch() {
      return this.$store.state.timerSwitch;
    },
    busList() {
      return getBusList();
    },
    stopsList() {
      if (this.formData.route == "" || this.formData.route == null) return [];
      return getStopsList(this.formData.route);
    },
    sameRouteStopList() {
      if (this.formData.sameRoute == "" || this.formData.sameRoute == null)
        return [];
      return getStopsList(this.formData.sameRoute);
    },
    currentProfile() {
      return this.$store.state.profiles.find(
        (p) => p.id === this.$store.state.currentProfileId
      );
    },
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
};
</script>

<style scoped>
.n-steps.n-steps--vertical:not(.n-steps--show-description) .n-step {
  padding-bottom: 0 !important;
}
</style>
