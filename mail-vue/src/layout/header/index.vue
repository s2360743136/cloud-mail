<template>
  <div class="header">
    <div class="header-btn">
      <hanburger @click="changeAside"></hanburger>
      <span class="breadcrumb-item">{{ $t(route.meta.title) }}</span>
    </div>
    <!-- aside-open：桌面端侧栏展开时侧栏里已经有写邮件按钮，这个圆形按钮就藏起来（样式里按屏幕宽度判断）。
         v3.4 上游把这里换成了透明的 el-button、桌面端一律隐藏；我们保留自己的渐变圆形按钮和显示规则 -->
    <div v-perm="'email:send'" class="writer-box" :class="{'aside-open': uiStore.asideShow}" @click="openSend">
      <div class="writer" :aria-label="$t('compose')">
        <Icon icon="material-symbols:edit-outline-sharp" width="22" height="22"/>
      </div>
    </div>
    <email-search
      v-if="showInboxSearch"
      :store="emailStore"
      :search-options="inboxSearchOptions"
      :class="{ 'account-show': accountPanelShow }"
      @search="returnToList('email')"
      @reset="returnToList('email')"
    />
    <email-search
      v-else-if="showSentSearch"
      :store="sendStore"
      :search-options="sentSearchOptions"
      :class="{ 'account-show': accountPanelShow }"
      @search="returnToList('send')"
      @reset="returnToList('send')"
    />
    <div class="toolbar">
      <el-dropdown
        ref="userDropdownRef"
        trigger="click"
        :teleported="false"
        popper-class="detail-dropdown"
        @visible-change="userCardVisible = $event"
      >
        <div class="avatar">
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
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useSettingStore} from "@/store/setting.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {setExtend} from "@/utils/day.js"
import emailSearch from '@/components/email-search/index.vue'
import {useEmailStore} from '@/store/email.js'
import {useSendStore} from '@/store/send.js'

const {t} = useI18n();
const route = useRoute();
const settingStore = useSettingStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const emailStore = useEmailStore()
const sendStore = useSendStore()
const logoutLoading = ref(false)
const userDropdownRef = ref(null)
const userCardVisible = ref(false)
const outsidePointerEvents = ['mousedown', 'pointerup', 'mouseup', 'click', 'pointercancel']
let blockOutsideClick = false
const inboxSearchOptions = computed(() => [
  {label: t('titleDesc'), type: 'subject'},
  {label: t('searchSummaryContent'), type: 'content'},
  {label: t('sender'), type: 'sender'},
  {label: t('searchSenderAddress'), type: 'senderAddress'},
])
const sentSearchOptions = computed(() => [
  {label: t('titleDesc'), type: 'subject'},
  {label: t('searchSummaryContent'), type: 'content'},
  {label: t('searchRecipientAddress'), type: 'recipientAddress'},
])
const accountPanelShow = computed(() => uiStore.accountShow && hasPerm('account:query'))
const showInboxSearch = computed(() =>
  route.meta.name === 'email' || isMailboxDetail('inbox')
)
const showSentSearch = computed(() =>
  route.meta.name === 'send' || isMailboxDetail('sent')
)

function isMailboxDetail(mailbox) {
  return route.meta.name === 'content' && route.params.mailbox === mailbox
}

function returnToList(listName) {
  if (route.meta.name !== 'content') return
  router.push({name: listName})
}

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

// v3.4 上游把顶栏的深色模式、公告两个按钮挪走了：深色切换进了「个人设置」页的 theme-selector 组件，
// 公告在个人设置页有「查看公告」按钮。这里跟着上游删掉，我们原来改过的地址栏取色挪到了 theme-selector 里
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

function isInsideUserCard(target) {
  const element = target instanceof Element ? target : target?.parentElement
  if (!(element instanceof Element)) return false
  if (userDropdownRef.value?.$el?.contains(element)) return true
  return !!element.closest('.detail-dropdown')
}

function handleUserCardPointerDown(event) {
  blockOutsideClick = userCardVisible.value && !isInsideUserCard(event.target)
  if (!blockOutsideClick) return

  event.preventDefault()
  event.stopPropagation()
  userDropdownRef.value?.handleClose()
}

function handleUserCardPointerEvent(event) {
  if (!blockOutsideClick) return
  event.preventDefault()
  event.stopPropagation()
  if (event.type === 'pointerup' || event.type === 'pointercancel') {
    setTimeout(() => {
      blockOutsideClick = false
    })
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleUserCardPointerDown, true)
  outsidePointerEvents.forEach(type => {
    document.addEventListener(type, handleUserCardPointerEvent, true)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleUserCardPointerDown, true)
  outsidePointerEvents.forEach(type => {
    document.removeEventListener(type, handleUserCardPointerEvent, true)
  })
})

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
  /* v3.4 上游新增：桌面端的搜索框（email-search）是相对顶栏绝对定位的 */
  position: relative;
}

/* 手机上标题区占满剩余宽度，搜索按钮、工具栏挤在右边（v3.4 上游规则，原样保留） */
@media (max-width: 767px) {
  .header-btn {
    flex: 1;
  }

  .toolbar {
    flex-shrink: 0;
  }
}

.writer-box {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
  flex-shrink: 0;

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
      box-sizing: border-box;
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
