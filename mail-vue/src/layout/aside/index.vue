<template>
  <el-scrollbar class="scroll">
    <div>
      <!-- 品牌区：渐变小方块 Logo + 站点标题，左对齐，高度和右侧顶栏一致 -->
      <div class="title" >
        <div class="logo">
          <Icon icon="mdi:email-outline" width="20" height="20" />
        </div>
        <div class="title-text">{{settingStore.settings.title}}</div>
      </div>
      <!-- 写邮件按钮放在侧栏最显眼的位置；桌面端显示侧栏时，顶栏里那个圆形按钮会隐藏 -->
      <div class="compose" v-perm="'email:send'" @click="openSend">
        <Icon icon="material-symbols:edit-outline-sharp" width="20" height="20"/>
        <span>{{ $t('compose') }}</span>
      </div>
      <!-- 文字颜色改由样式里的 CSS 变量控制（原来写死 #fff，只适合深色侧栏） -->
      <el-menu :collapse="false">
        <el-menu-item @click="router.push({name: 'email'})" index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <Icon icon="hugeicons:mailbox-01" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('inbox')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'send'})" index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <Icon icon="cil:send" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('sent')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'draft'})" index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <Icon icon="ep:document" width="19" height="19" />
          <span class="menu-name" style="margin-left: 17px">{{$t('drafts')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'star'})" index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <Icon icon="solar:star-line-duotone" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('starred')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'setting'})" index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <Icon icon="fluent:settings-48-regular" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('settings')}}</span>
        </el-menu-item>
        <div class="manage-title" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
          <div>{{$t('manage')}}</div>
        </div>
        <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <Icon icon="fluent:data-pie-20-regular" width="24" height="24" />
          <span class="menu-name" style="margin-left: 13px">{{$t('analytics')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'user'})" index="setting" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <Icon icon="si:user-alt-2-line" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('allUsers')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <Icon icon="fluent:mail-list-28-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 15px">{{$t('allMail')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'role'})" index="setting" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <Icon icon="fluent:lock-closed-16-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 15px">{{$t('permissions')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <Icon icon="fluent:fingerprint-20-filled" width="22" height="22" />
          <span class="menu-name" style="margin-left: 15px">{{$t('inviteCode')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <Icon icon="eos-icons:system-ok-outlined" width="18" height="18" style="margin-left: 2px" />
          <span class="menu-name" style="margin-left: 17px">{{$t('SystemSettings')}}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </el-scrollbar>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import {Icon} from "@iconify/vue";
import {useSettingStore} from "@/store/setting.js";
import {useUiStore} from "@/store/ui.js";

const settingStore = useSettingStore();
const uiStore = useUiStore();
const route = useRoute();

// 侧栏里的写邮件按钮：和顶栏按钮一样打开写信窗口。
// 手机/平板上侧栏是盖在内容上的抽屉，先把抽屉收起来，不然写信窗口打开后抽屉和遮罩还盖在页面上
function openSend() {
  if (window.innerWidth < 1025) {
    uiStore.asideShow = false
  }
  uiStore.writerRef.open()
}

</script>

<style lang="scss" scoped>

/* 品牌区：高度 60px 和右侧顶栏对齐，Logo 是渐变圆角方块，标题用正文色加粗 */
.title {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 22px;
  max-width: 260px;
  color: var(--el-text-color-primary);

  .logo {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    background: var(--brand-gradient);
    box-shadow: 0 4px 10px -4px rgba(51, 112, 255, 0.6);
  }

  .title-text {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.2px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

/* 写邮件按钮：侧栏里唯一的实心按钮，用品牌渐变 + 同色投影做视觉重心 */
.compose {
  margin: 4px 14px 10px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  background: var(--brand-gradient);
  box-shadow: 0 6px 16px -6px rgba(51, 112, 255, 0.55);
  cursor: pointer;
  user-select: none;
  transition: filter 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;

  &:hover {
    filter: brightness(1.06);
    box-shadow: 0 8px 20px -6px rgba(51, 112, 255, 0.65);
  }

  &:active {
    transform: translateY(1px);
  }
}

/* "管理"分组标题：小号灰字，和菜单项拉开层级 */
.manage-title {
  margin: 14px 0 4px;
  padding-left: 24px;
  font-size: 12px;
  letter-spacing: 0.5px;
  color: var(--aside-muted-color);
  user-select: none;
}

/* 菜单项：圆角胶囊，常态用正文灰，悬停浅灰底，选中是主色浅底 + 主色字 */
.el-menu-item {
  margin: 2px 12px !important;
  border-radius: 8px;
  height: 38px;
  padding: 10px !important;
  color: var(--aside-text-color);
}

/* Element 会给最后点过的菜单项加 is-active 并改成主色，但它按 index 判断，
   而这里有几个菜单共用 index="setting"，会出现两项同时高亮；统一以路由算出来的 choose-item 为准 */
.el-menu-item.is-active {
  color: var(--aside-text-color);
}

.choose-item,
.choose-item.is-active {
  font-weight: 600;
  color: var(--aside-active-color);
  background: var(--aside-menu-active-background) !important;
}

@media (hover: hover) {
  .el-menu-item:not(.choose-item):hover {
    background: var(--aside-hover-background) !important;
  }
}

.menu-name {
  user-select: none;
}


:deep(.el-scrollbar__wrap--hidden-default ) {
  background: var(--aside-backgound) !important;
}

:deep(.el-menu-item) {
  background: var(--aside-backgound);
}

:deep(.el-menu) {
  background: var(--aside-backgound);
}

.el-menu {
  border-right: 0;
  width: 260px;
}

:deep(.el-divider__text) {
  background: var(--aside-backgound);
  color: #FFFFFF;
}

.scroll {

}
</style>
