<template>
  <el-container class="layout">
    <el-aside
        class="aside"
        :class="uiStore.asideShow ? 'aside-show' : 'el-aside-hide'">
      <Aside />
    </el-aside>
    <div
        :class="(uiStore.asideShow && isMobile)? 'overlay-show':'overlay-hide'"
        @click="uiStore.asideShow = false"
    ></div>
    <el-container class="main-container">
      <el-main>
        <el-header>
            <Header />
        </el-header>
        <Main />
      </el-main>
    </el-container>
  </el-container>
  <writer ref="writerRef" />
</template>

<script setup>
import Aside from '@/layout/aside/index.vue'
import Header from '@/layout/header/index.vue'
import Main from '@/layout/main/index.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {useUiStore} from "@/store/ui.js";
import writer from '@/layout/write/index.vue'

const uiStore = useUiStore();
const writerRef = ref({})
const isMobile = ref(window.innerWidth < 1025)
const handleResize = () => {
  isMobile.value = window.innerWidth < 1025
  uiStore.asideShow = window.innerWidth > 1024;
}

onMounted(() => {
  uiStore.writerRef = writerRef

  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.el-aside-hide {
  position: fixed;
  left: 0;
  height: 100%;
  z-index: 100;
  transform: translateX(-100%);
  transition: all 100ms ease;
}

.aside-show {
  -webkit-box-shadow: var(--aside-right-border);
  box-shadow: var(--aside-right-border);
  transform: translateX(0);
  transition: all 100ms ease;
  z-index: 101;
  @media (max-width: 1025px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 101;
    height: 100%;
    background: var(--el-bg-color);
    /* 桌面端侧栏和底色融为一体不需要阴影，手机端是浮在内容上的抽屉，要一道阴影和内容分开 */
    box-shadow: 0 0 32px rgba(15, 23, 42, 0.18);
  }
}

.el-aside {
  width: auto;
  transition: all 100ms ease;
}

.layout {
  height: 100%;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
}

.main-container {
  min-height: 100%;
  /* 右侧整体铺应用底色，内容区在 main/index.vue 里做成压在底色上的白色圆角面板 */
  background: var(--app-bg);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.el-main {
  padding: 0;
}

.el-header {
  /* 顶栏和底色一体，不再画分割线，靠下面的白色面板区分层次 */
  background: var(--app-bg);
  border-bottom: none;
  padding: 0 0 0 0;
  /* 手机上内容面板是贴边的，顶栏换回白底加细线，避免灰白两块拼在一起显得脏；
     高度 50px 是 v3.4 上游改的（手机顶栏压矮一点），一并保留 */
  @media (max-width: 767px) {
    background: var(--el-bg-color);
    border-bottom: solid 1px var(--el-border-color-lighter);
    height: 50px;
  }
}

.overlay-show {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 99;
  transition: all 0.3s;
}

.overlay-hide {
  display: flex;
  pointer-events: none;
  opacity: 0;
}
</style>
