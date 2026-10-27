<template>
  <div class="box">
    <!-- 顶部操作图标原来来自 5 个不同图标库，粗细不一；统一成 Fluent 单色线条，已加星仍用彩色星标 -->
    <div class="header-actions">
      <Icon class="icon" icon="fluent:arrow-left-24-regular" width="18" height="18" @click="handleBack"/>
      <Icon v-perm="'email:delete'" class="icon" icon="fluent:delete-24-regular" width="18" height="18" @click="handleDelete"/>
      <span class="star" v-if="emailStore.contentData.showStar">
        <Icon class="icon" @click="changeStar" v-if="email.isStar" icon="fluent-color:star-16" width="18" height="18"/>
        <Icon class="icon" @click="changeStar" v-else icon="fluent:star-24-regular" width="18" height="18"/>
      </span>
      <Icon class="icon" v-if="emailStore.contentData.showReply" v-perm="'email:send'"  @click="openReply" icon="fluent:arrow-reply-24-regular" width="18" height="18" />
      <Icon class="icon" v-if="emailStore.contentData.showReply" v-perm="'email:send'"  @click="openForward" icon="fluent:arrow-forward-24-regular" width="18" height="18" />
    </div>
    <div></div>
    <el-scrollbar class="scrollbar">
      <div class="container">
        <div class="email-title">
          {{ email.subject }}
        </div>
        <div class="content">
          <div class="email-info">
            <!-- 发件人信息前加一个首字母头像（颜色按发件邮箱固定），和邮箱栏的头像风格一致。
                 发件人这一行用的是 v3.4 上游的新结构：sendNameRef + is-wrapped 用来在放不下时把邮箱地址换到第二行，
                 sent-via 是「代发」标签（邮件头里实际发件地址 senderEmail 和显示的 From 不一致时出现） -->
            <div class="sender-card">
              <div class="sender-avatar" :style="{background: avatarColor(email.sendEmail)}">
                {{ avatarLetter(email.name || email.sendEmail) }}
              </div>
              <div class="sender-meta">
                <div class="send"><span class="send-source">{{$t('from')}}</span>
                  <div class="send-name" ref="sendNameRef" :class="{ 'is-wrapped': senderWrapped }">
                    <span class="send-name-title">{{ email.name }}</span>
                    <span class="send-email"><{{ email.sendEmail }}></span>
                    <span class="sent-via" v-if="sentViaEmail">
                      <el-tooltip effect="dark" :content="$t('sentVia', { email: sentViaEmail })">
                        <span>
                          <el-tag size="small" disable-transitions>{{ $t('sentViaTag') }}</el-tag>
                        </span>
                      </el-tooltip>
                    </span>
                  </div>
                </div>
                <div class="receive"><span class="source">{{$t('recipient')}}</span><span class="receive-email">{{  formateReceive(email.recipient) }}</span></div>
                <div class="date">
                  <div>{{ formatDetailDate(email.createTime) }}</div>
                </div>
              </div>
            </div>
            <el-alert v-if="email.status === 3" :closable="false" :title="toMessage(email.message)" class="email-msg" type="error" show-icon />
            <el-alert v-if="email.status === 4" :closable="false" :title="$t('complained')" class="email-msg" type="warning" show-icon />
            <el-alert v-if="email.status === 5" :closable="false" :title="$t('delayed')" class="email-msg" type="warning" show-icon />
          </div>
          <el-scrollbar class="htm-scrollbar" :class="!email.attList?.length ? 'bottom-distance' : ''">
            <ShadowHtml class="shadow-html" :html="formatImage(email.content)" v-if="email.content" />
            <pre v-else class="email-text" >{{email.text}}</pre>
          </el-scrollbar>
          <div class="att" v-if="email.attList?.length > 0">
            <div class="att-title">
              <span>{{$t('attachments')}}</span>
              <span>{{$t('attCount',{total: email.attList.length})}}</span>
            </div>
            <div class="att-box">

              <div class="att-item" v-for="att in email.attList" :key="att.attId">
                <div class="att-icon" @click="showImage(att.key)">
                  <Icon v-bind="getIconByName(att.filename)" />
                </div>
                <div class="att-name" @click="showImage(att.key)">
                  {{ att.filename }}
                </div>
                <div class="att-size">{{ formatBytes(att.size) }}</div>
                <div class="opt-icon att-icon">
                  <Icon v-if="isImage(att.filename)" icon="fluent:eye-24-regular" width="18" height="18" @click="showImage(att.key)"/>
                  <a :href="cvtR2Url(att.key)" download>
                    <Icon icon="fluent:arrow-download-24-regular" width="18" height="18"/>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <el-image-viewer
        v-if="showPreview"
        :url-list="srcList"
        show-progress
        @close="showPreview = false"
    />
  </div>
</template>
<script setup>
import ShadowHtml from '@/components/shadow-html/index.vue'
import {computed, reactive, ref, watch, onMounted, onUnmounted, nextTick} from "vue";
import {useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {emailDelete, emailRead} from "@/request/email.js";
import {Icon} from "@iconify/vue";
import {useEmailStore} from "@/store/email.js";
import {useAccountStore} from "@/store/account.js";
import {formatDetailDate} from "@/utils/day.js";
import {starAdd, starCancel} from "@/request/star.js";
import {getExtName, formatBytes} from "@/utils/file-utils.js";
import {cvtR2Url,toOssDomain} from "@/utils/convert.js";
import {getIconByName} from "@/utils/icon-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {allEmailDelete} from "@/request/all-email.js";
import {useUiStore} from "@/store/ui.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";
import {avatarColor, avatarLetter} from "@/utils/avatar.js";
const { t } = useI18n()

const uiStore = useUiStore();
const settingStore = useSettingStore();
const accountStore = useAccountStore();
const emailStore = useEmailStore();
const router = useRouter()
const sendNameRef = ref(null)
const senderWrapped = ref(false)
let senderResizeObserver = null

const showPreview = ref(false)
const srcList = reactive([])


const email = computed(() => emailStore.contentData.email || {
  emailId: 0,
  attList: [],
  content: '',
  text: '',
  recipient: '[]',
})

const sentViaEmail = computed(() => {
  const raw = String(email.value.senderEmail || '').trim()
  if (!raw) return ''
  const matched = raw.match(/<([^>]+)>/)
  const address = (matched ? matched[1] : raw).trim()
  if (!address || address.toLowerCase() === String(email.value.sendEmail || '').trim().toLowerCase()) return ''
  return address
})

watch(() => accountStore.currentAccountId, () => {
  handleBack()
})

let readRequesting = false

function contentWidth(el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  const width = range.getBoundingClientRect().width
  range.detach()
  return width
}

function updateSenderWrap() {
  const root = sendNameRef.value
  if (!root) return
  const name = root.querySelector('.send-name-title')
  const mail = root.querySelector('.send-email')
  const tag = root.querySelector('.sent-via')
  if (!name || !mail) {
    senderWrapped.value = false
    return
  }
  const gap = 6
  let need = contentWidth(name) + gap + contentWidth(mail)
  if (tag) need += gap + contentWidth(tag)
  senderWrapped.value = need > root.clientWidth + 0.5
}


function tryMarkRead() {
  if (!emailStore.contentData.showUnread || readRequesting) return
  const current = email.value
  if (!current?.emailId || current.unread !== EmailUnreadEnum.UNREAD) return

  // 等详情数据就绪（detailMap 已写入，或正文已有内容）再标已读
  const full = emailStore.detailMap[current.emailId]
  const detailReady = !!full || !!(current.content || current.text)
  if (!detailReady) return

  readRequesting = true
  const emailId = current.emailId
  current.unread = EmailUnreadEnum.READ
  if (emailStore.detailMap[emailId]) {
    emailStore.detailMap[emailId].unread = EmailUnreadEnum.READ
  }
  emailStore.markListRead(emailId)
  emailRead([emailId]).finally(() => {
    readRequesting = false
  })
}

watch(
  () => [
    email.value?.emailId,
    email.value?.content,
    email.value?.text,
    emailStore.detailMap[email.value?.emailId]
  ],
  () => tryMarkRead(),
  { flush: 'post' }
)

watch(
  () => [email.value?.name, email.value?.sendEmail, sentViaEmail.value],
  () => nextTick(updateSenderWrap)
)

onMounted(() => {
  tryMarkRead()
  window.addEventListener('keydown', handleKeyDown);
  senderResizeObserver = new ResizeObserver(() => updateSenderWrap())
  if (sendNameRef.value) senderResizeObserver.observe(sendNameRef.value)
  nextTick(updateSenderWrap)
})

onUnmounted(() => {
  emailStore.contentData.showUnread = false;
  readRequesting = false
  window.removeEventListener('keydown', handleKeyDown);
  senderResizeObserver?.disconnect()
})

function handleKeyDown(event) {
  if (event.key !== 'Escape') return;
  if (showPreview.value) return;
  if (document.querySelector('.el-message-box')) return;
  const writeBox = document.querySelector('.write-box');
  if (writeBox && writeBox.offsetParent !== null) return;
  handleBack();
}

function openReply() {
  uiStore.writerRef.openReply(email.value)
}

function openForward() {
  uiStore.writerRef.openForward(email.value)
}

function toMessage(message) {
  return  message ? JSON.parse(message).message : '';
}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return  content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function showImage(key) {
  if (!isImage(key)) return;
  const url = cvtR2Url(key)
  srcList.length = 0
  srcList.push(url)
  showPreview.value = true
}

function isImage(filename) {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif','jfif'].includes(getExtName(filename))
}

function formateReceive(recipient) {
  if (!recipient) return ''
  recipient = JSON.parse(recipient)
  return recipient.map(item => item.address).join(', ')
}

function changeStar() {
  if (email.value.isStar) {
    email.value.isStar = 0;
    starCancel(email.value.emailId).then(() => {
      email.value.isStar = 0;
      emailStore.cancelStarEmailId = email.value.emailId
      setTimeout(() => emailStore.cancelStarEmailId = 0)
      emailStore.starScroll?.deleteEmail([email.value.emailId])
    }).catch((e) => {
      console.error(e)
      email.value.isStar = 1;
    })
  } else {
    email.value.isStar = 1;
    starAdd(email.value.emailId).then(() => {
      email.value.isStar = 1;
      emailStore.addStarEmailId = email.value.emailId
      setTimeout(() => emailStore.addStarEmailId = 0)
      emailStore.starScroll?.addItem(email.value)
    }).catch((e) => {
      console.error(e)
      email.value.isStar = 0;
    })
  }
}

const handleBack = () => {
  router.back()
}

const handleDelete = () => {
  ElMessageBox.confirm(t('delEmailConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    if (emailStore.contentData.delType === 'logic') {
      emailDelete(email.value.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.value.emailId]
      })
    } else  {

      allEmailDelete(email.value.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.value.emailId]
      })
    }

    router.back()
  })
}
</script>
<style scoped lang="scss">
.box {
  height: 100%;
  overflow: hidden;
}

/* 操作栏总高度仍是 38px（下面 .scrollbar 按 100% - 38px 算），图标做成 28px 的悬停按钮 */
.header-actions {
  padding: 5px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: var(--header-actions-border);
  font-size: 18px;
  color: var(--el-text-color-secondary);
  .star {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 21px;
  }
  /* 全局是 border-box，改回 content-box，padding 才不会把 18px 的图标挤小 */
  .icon {
    cursor: pointer;
    box-sizing: content-box;
    padding: 5px;
    border-radius: 8px;
    transition: background 0.15s ease, color 0.15s ease;

    &:hover {
      background: var(--icon-btn-hover-background);
      color: var(--el-text-color-primary);
    }
  }
}


.scrollbar {
  height: calc(100% - 38px);
  width: 100%;
}

.container {
  font-size: 14px;
  padding-left: 24px;
  padding-right: 24px;
  padding-top: 18px;
  @media (max-width: 1023px) {
    padding-left: 15px;
    padding-right: 15px;
    padding-top: 12px;
  }

  .email-title {
    font-size: 22px;
    font-weight: 600;
    line-height: 1.4;
    word-break: break-word;
    margin-bottom: 16px;
    @media (max-width: 767px) {
      font-size: 19px;
    }
  }

  .htm-scrollbar {
  }

  .content {
    display: flex;
    flex-direction: column;

    .att {
      margin-top: 30px;
      margin-bottom: 30px;
      border: 1px solid var(--light-border-color);
      padding: 14px;
      border-radius: 12px;
      width: fit-content;
      .att-box {
        min-width: min(410px,calc(100vw - 60px));
        max-width: 600px;
        display: grid;
        gap: 12px;
        grid-template-rows: 1fr;
      }

      .att-title {
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        span:first-child {
          font-weight: bold;
        }
      }

      .att-item {
        cursor: pointer;
        div {
          align-self: center;
        }
        background: var(--light-ill);
        padding: 8px 10px;
        border-radius: 8px;
        transition: background 0.15s ease;

        &:hover {
          background: var(--email-hover-background);
        }
        align-self: start;
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        .att-icon {
          display: grid;
        }

        .att-size {
          color: var(--secondary-text-color);
        }

        .att-name {
          margin-left: 8px;
          margin-right: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-all;
        }

        .att-image {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }

        .opt-icon {
          padding-left: 10px;
          color: var(--secondary-text-color);
          align-items: center;
          display: flex;
          gap: 8px;
          cursor: pointer;
          a {
            color: var(--secondary-text-color);
            align-items: center;
            display: flex;
          }
        }
      }
    }

    .email-info {

      border-bottom: 1px solid var(--light-border-color);
      margin-bottom: 20px;
      padding-bottom: 12px;
      @media (max-width: 1024px) {
        margin-bottom: 15px;
      }

      /* 头像在左、发件信息在右；头像和第一行文字顶部对齐 */
      .sender-card {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .sender-avatar {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
        @media (max-width: 767px) {
          width: 36px;
          height: 36px;
          font-size: 15px;
        }
      }

      .sender-meta {
        flex: 1;
        min-width: 0;
      }

      .date {
        color: var(--secondary-text-color);
        font-size: 13px;
        margin-bottom: 6px;
      }

      .email-msg {
        max-width: 400px;
        width: fit-content;
        margin-bottom: 15px;
      }

      .send {
        display: flex;
        margin-bottom: 4px;

        .send-name {
          color: var(--secondary-text-color);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          column-gap: 6px;

          /* 发件人名字加粗用正文色，后面的邮箱地址用次要灰，主次分明 */
          .send-name-title {
            font-weight: 600;
            color: var(--el-text-color-primary);
          }

          /* 下面三段是 v3.4 上游的：地址太长时允许任意位置断行；放不下时（is-wrapped）
             名字、代发标签留在第一行，邮箱地址单独换到第二行 */
          .send-email {
            max-width: 100%;
            overflow-wrap: anywhere;
          }

          &.is-wrapped {
            .send-name-title {
              order: 1;
            }

            .sent-via {
              order: 2;
            }

            .send-email {
              order: 3;
              flex-basis: 100%;
            }
          }
        }
      }

      .receive {
        margin-bottom: 4px;
        display: flex;
        .receive-email {
          max-width: 700px;
          word-break: break-word;
        }
        span:nth-child(2) {
          color: var(--regular-text-color);
        }
      }

      /* "发件人/收件人"标签降为次要灰，不再和内容抢视线 */
      .send-source {
        white-space: nowrap;
        color: var(--secondary-text-color);
        padding-right: 10px;
      }

      .source {
        white-space: nowrap;
        color: var(--secondary-text-color);
        padding-right: 10px;
      }
    }
  }
}

.shadow-html::after  {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--message-block-color); /* 半透明黑色蒙层 */
  pointer-events: none; /* 不影响点击 */
}

.email-text {
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.bottom-distance {
  margin-bottom: 30px;
}


</style>
