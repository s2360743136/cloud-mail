<template>
  <div class="header" :class="!hasPerm('email:send') ? 'not-send' : ''">
    <div class="header-btn">
      <hanburger @click="changeAside"></hanburger>
      <span class="breadcrumb-item">{{ $t(route.meta.title) }}</span>
    </div>
    <!-- aside-open：桌面端侧栏展开时侧栏里已经有写邮件按钮，这个圆形按钮就藏起来（样式里按屏幕宽度判断） -->
    <div v-perm="'email:send'" class="writer-box" :class="{'aside-open': uiStore.asideShow}" @click="openSend">
      <div class="writer">
        <Icon icon="material-symbols:edit-outline-sharp" width="22" height="22"/>
      </div>
    </div>
    <div class="toolbar">
      <div v-if="uiStore.dark" class="sun-icon icon-item" @click="openDark($event)">
        <Icon icon="mingcute:sun-fill"/>
      </div>
      <div v-else class="dark-icon icon-item" @click="openDark($event)">
        <Icon icon="solar:moon-linear"/>
      </div>
      <div class="notice icon-item" @click="openNotice">
        <Icon icon="streamline-plump:announcement-megaphone"/>
      </div>
      <el-dropdown ref="userinfoRef" @visible-change="e => userInfoShow = e" :teleported="false" popper-class="detail-dropdown">
        <div class="avatar" @click="userInfoHide" >
          <div class="avatar-text">
            <div>{{ formatName(userStore.user.email) }}</div>
          </div>
          <Icon class="setting-icon" icon="mingcute:down-small-fill" width="24" height="24"/>
        </div>
        <template #dropdown>
          <div class="user-details">
            <div class="details-avatar">
              {{ formatName(userStore.user.email) }}
            </div>
            <div class="user-name">
              {{ userStore.user.name }}
            </div>
            <div class="detail-email" @click="copyEmail(userStore.user.email)">
              {{ userStore.user.email }}
            </div>
            <div class="detail-user-type">
              <el-tag>{{ userStore.user.role.name }}</el-tag>
            </div>
            <div class="action-info">
              <div>
                <span style="margin-right: 10px">{{ $t('sendCount') }}</span>
                <span style="margin-right: 10px">{{ $t('accountCount') }}</span>
              </div>
              <div>
                <div>
                  <span v-if="sendCount" style="margin-right: 5px">{{ sendCount }}</span>
                  <el-tag v-if="!hasPerm('email:send')">{{ sendType }}</el-tag>
                  <el-tag v-else>{{ sendType }}</el-tag>
                </div>
                <div>
                  <el-tag v-if="settingStore.settings.manyEmail || settingStore.settings.addEmail">
                    {{ $t('disabled') }}
                  </el-tag>
                  <span v-else-if="accountCount && hasPerm('account:add')"
                        style="margin-right: 5px">{{ $t('totalUserAccount', {msg: accountCount}) }}</span>
                  <el-tag v-else-if="!accountCount && hasPerm('account:add')">{{ $t('unlimited') }}</el-tag>
                  <el-tag v-else-if="!hasPerm('account:add')">{{ $t('unauthorized') }}</el-tag>
                </div>
              </div>
            </div>
            <div class="logout">
              <el-button type="primary" :loading="logoutLoading" @click="clickLogout">{{ $t('logOut') }}</el-button>
            </div>
          </div>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import router from "@/router";
import hanburger from '@/components/hamburger/index.vue'
import {logout} from "@/request/login.js";
import {Icon} from "@iconify/vue";
import {useUiStore} from "@/store/ui.js";
import {useUserStore} from "@/store/user.js";
import {useRoute} from "vue-router";
import {computed, ref} from "vue";
import {useSettingStore} from "@/store/setting.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {setExtend} from "@/utils/day.js"

const {t} = useI18n();
const route = useRoute();
const settingStore = useSettingStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const logoutLoading = ref(false)
const userInfoShow = ref(false)
const userinfoRef = ref({})

const accountCount = computed(() => {
  return userStore.user.role.accountCount
})

const sendType = computed(() => {

  if (settingStore.settings.send === 1) {
    return t('disabled')
  }

  if (!hasPerm('email:send')) {
    return t('unauthorized')
  }

  if (userStore.user.role.sendType === 'ban') {
    return t('sendBanned')
  }

  if (userStore.user.role.sendType === 'internal') {
    return t('sendInternal')
  }

  if (!userStore.user.role.sendCount) {
    return t('unlimited')
  }

  if (userStore.user.role.sendType === 'day') {
    return t('daily')
  }

  if (userStore.user.role.sendType === 'count') {
    return t('total')
  }
})

const sendCount = computed(() => {


  if (!hasPerm('email:send')) {
    return null
  }

  if (userStore.user.role.sendType === 'ban') {
    return null
  }

  if (userStore.user.role.sendType === 'internal') {
    return null
  }

  if (!userStore.user.role.sendCount) {
    return null
  }

  if (settingStore.settings.send === 1) {
    return null
  }

  return userStore.user.sendCount + '/' + userStore.user.role.sendCount
})

function userInfoHide(e) {
    if (userInfoShow.value) {
        userinfoRef.value.handleClose()
    } else {
        userinfoRef.value.handleOpen()
    }
}

async function copyEmail(email) {
  try {
    await navigator.clipboard.writeText(email);
    ElMessage({
      message: t('copySuccessMsg'),
      type: 'success',
      plain: true,
    })
  } catch (err) {
    console.error(`${t('copyFailMsg')}:`, err);
    ElMessage({
      message: t('copyFailMsg'),
      type: 'error',
      plain: true,
    })
  }
}

function changeLang(lang) {
  setExtend(lang === 'en' ? 'en' : 'zh-cn')
  settingStore.lang = lang
}

function openNotice() {
  uiStore.showNotice()
}

function openDark(e) {

  const nextIsDark = !uiStore.dark
  const root = document.documentElement

  if (!document.startViewTransition) {
    switchDark(nextIsDark, root);
    return
  }

  const x = e.clientX
  const y = e.clientY

  const maxX = Math.max(x, window.innerWidth - x)
  const maxY = Math.max(y, window.innerHeight - y)
  const endRadius = Math.hypot(maxX, maxY)

  // 标记切换目标，供 CSS 选择器使用
  root.setAttribute('data-theme-to', nextIsDark ? 'dark' : 'light')
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-end-radius', `${endRadius + 10}px`)

  const transition = document.startViewTransition(() => {
    switchDark(nextIsDark, root);
  })

  transition.finished.finally(() => {
    // 清理标记
    root.removeAttribute('data-theme-to')
  })
}

function switchDark(nextIsDark, root) {
  root.setAttribute('class', nextIsDark ? 'dark' : '')
  const metaTag = document.getElementById('theme-color-meta');
  const isMobile =  !window.matchMedia("(pointer: fine) and (hover: hover)").matches;
  // 浏览器地址栏/状态栏颜色跟着顶栏走：手机上顶栏是白底（暗色 #141414），桌面端是应用底色 --app-bg。
  // index.html 里首屏也有同样一套取值，两处要一起改
  metaTag.setAttribute('content', nextIsDark ? (isMobile ? '#141414' : '#0C0C0E') : (isMobile ? '#FFFFFF' : '#F4F6FA'));
  uiStore.dark = nextIsDark
}

function openSend() {
  uiStore.writerRef.open()
}

function changeAside() {
  uiStore.asideShow = !uiStore.asideShow
}

function clickLogout() {
  logoutLoading.value = true
  logout().then(() => {
    localStorage.removeItem("token")
    router.replace('/login')
  }).finally(() => {
    logoutLoading.value = false
  })
}

function formatName(email) {
  return email[0]?.toUpperCase() || ''
}

</script>
<style>
.detail-dropdown {
  color: var(--el-text-color-primary) !important;
}
</style>
<style lang="scss" scoped>

:deep(.el-popper.is-pure) {
  border-radius: 12px;
}

.user-details {
  width: 250px;
  font-size: 14px;
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;

  .user-name {
    font-weight: bold;
    margin-top: 10px;
    padding-left: 20px;
    padding-right: 20px;
    width: 250px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
  }

  .detail-user-type {
    margin-top: 10px;
  }

  /* 发送额度 / 邮箱数量：原来两列直接贴着卡片左边、没有内边距；
     改成卡片里一块浅底信息区，左边标签、右边额度。左右两列是分开的两组元素，
     每行都固定 24px（和 el-tag 默认高度一致），这样标签和对应的额度才能对齐在同一行 */
  .action-info {
    justify-self: stretch;
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: 12px;
    margin: 14px 14px 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--el-fill-color-light);

    > div:first-child {
      display: grid;
      gap: 8px;
      color: var(--el-text-color-secondary);

      > span {
        height: 24px;
        display: flex;
        align-items: center;
      }
    }

    > div:last-child {
      display: grid;
      gap: 8px;
      justify-items: end;

      > div {
        height: 24px;
        display: flex;
        align-items: center;
      }
    }
  }

  .detail-email {
    padding-left: 20px;
    padding-right: 20px;
    width: 250px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
    color: var(--regular-text-color);
    cursor: pointer;
  }

  .logout {
    margin-top: 14px;
    width: 100%;
    padding-left: 14px;
    padding-right: 14px;
    padding-bottom: 14px;

    .el-button {
      border-radius: 8px;
      height: 32px;
      width: 100%;
    }
  }

  /* 下拉卡片里的大头像：和顶栏小头像一样用品牌渐变圆形 */
  .details-avatar {
    margin-top: 20px;
    height: 48px;
    width: 48px;
    background: var(--brand-gradient);
    color: #ffffff;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
}


/* 原来是三列 grid，写信按钮一隐藏右侧工具栏就会挤到标题旁边；改成 flex + 工具栏 margin-left: auto，
   不管写信按钮在不在，工具栏都靠右 */
.header {
  font-size: 12px;
  display: flex;
  align-items: center;
  height: 100%;
  gap: 10px;
  padding-right: 14px;
}

.writer-box {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;

  .writer {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: #ffffff;
    background: var(--brand-gradient);
    box-shadow: 0 4px 12px -4px rgba(51, 112, 255, 0.6);
    transition: filter 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    .writer-text {
      margin-left: 15px;
      font-size: 14px;
      font-weight: bold;;
    }
  }

  &:hover .writer {
    filter: brightness(1.06);
  }

  /* 桌面端侧栏展开时，侧栏顶部已经有写邮件按钮，这里不再重复；侧栏收起或在手机上时照常显示 */
  @media (min-width: 1025px) {
    &.aside-open {
      display: none;
    }
  }
}

.header-btn {
  display: inline-flex;
  align-items: center;
  height: 100%;
  min-width: 0;
}

.breadcrumb-item {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 右侧工具栏：图标统一成 36px 的圆角按钮，常态用次要灰，悬停加底色并变深 */
.toolbar {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-secondary);

  .icon-item {
    align-self: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .icon-item:hover {
    background: var(--icon-btn-hover-background);
    color: var(--el-text-color-primary);
  }

  .notice {
    font-size: 20px;
  }

  .dark-icon {
    font-size: 20px;
  }

  .sun-icon {
    font-size: 22px;
  }

  /* 头像：品牌渐变圆形 + 白色首字母，整块（含下拉箭头）悬停有底色 */
  .avatar {
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-left: 6px;
    padding: 2px;
    border-radius: 20px;
    transition: background 0.15s ease;

    &:hover {
      background: var(--icon-btn-hover-background);
    }

    .avatar-text {
      background: var(--brand-gradient);
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      height: 32px;
      width: 32px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
    }

    .setting-icon {
      position: relative;
      top: 0;
      margin-right: 2px;
      bottom: 10px;
    }
  }

}

.el-tooltip__trigger:first-child:focus-visible {
  outline: unset;
}
</style>
