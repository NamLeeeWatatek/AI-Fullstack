# ⚖️ Widget Architecture Comparison

## 🔴 Kiến trúc CŨ (Simple - Không tốt cho production)

### Database Schema
```
bot
├── id
├── name
├── widget_enabled (boolean)
└── widget_config (JSONB) ← Chỉ 1 config, không version
```

### Vấn đề
❌ **Không rollback được**
- Update config = overwrite
- Mất config cũ
- Nếu có bug → phải fix manual

❌ **Không có history**
- Không biết ai thay đổi gì, khi nào
- Không so sánh được giữa versions
- Không audit trail

❌ **Không A/B testing**
- Chỉ có 1 config active
- Không test được version mới trước khi deploy full

❌ **Không analytics per version**
- Không biết version nào perform tốt hơn
- Không track error rate per version

❌ **Deploy rủi ro cao**
- Update là overwrite ngay
- Nếu có bug → ảnh hưởng 100% users
- Không có safety net

### Khi nào dùng?
✅ MVP / Prototype
✅ Internal tools
✅ < 100 users
✅ Không cần rollback

---

## 🟢 Kiến trúc MỚI (Versioning - Production-ready)

### Database Schema
```
bot
├── id
├── name
└── widget_enabled (boolean)

widget_version (1:N với bot)
├── id
├── bot_id
├── version (1.0.0, 1.0.1, 2.0.0)
├── status (draft, published, archived)
├── is_active (boolean) ← Chỉ 1 version active
├── config (JSONB) ← Full config
├── published_at
├── published_by
├── cdn_url
└── changelog

widget_deployment (History)
├── id
├── bot_id
├── widget_version_id
├── deployment_type (publish, rollback, canary)
├── previous_version_id
├── rollback_reason
└── deployed_at

widget_analytics (Per version)
├── id
├── bot_id
├── widget_version_id
├── event_type
├── load_time_ms
└── created_at
```

### Ưu điểm
✅ **Rollback trong 1 click**
- Giữ tất cả versions
- Rollback = activate version cũ
- < 1 phút để rollback

✅ **Full history**
- Track mọi thay đổi
- Biết ai deploy, khi nào
- Có changelog cho mỗi version

✅ **A/B Testing**
- Deploy 2 versions cùng lúc
- 50% traffic dùng v1, 50% dùng v2
- So sánh metrics

✅ **Canary Deployment**
- Deploy version mới cho 10% traffic
- Monitor metrics
- Nếu OK → scale lên 100%
- Nếu có bug → rollback ngay

✅ **Analytics per version**
- Track performance của từng version
- So sánh error rate
- Biết version nào tốt hơn

✅ **Deploy an toàn**
- Draft → Preview → Publish
- Có thể test trước khi deploy
- Rollback nhanh nếu có vấn đề

### Khi nào dùng?
✅ Production apps
✅ > 100 users
✅ Cần rollback
✅ Cần A/B testing
✅ Cần audit trail

---

## 📊 So sánh chi tiết

| Feature | Kiến trúc CŨ | Kiến trúc MỚI |
|---------|--------------|---------------|
| **Rollback** | ❌ Không có | ✅ 1 click, < 1 phút |
| **History** | ❌ Không có | ✅ Full history |
| **A/B Testing** | ❌ Không có | ✅ Có |
| **Canary Deploy** | ❌ Không có | ✅ Có |
| **Analytics** | ⚠️ Chung | ✅ Per version |
| **Audit Trail** | ❌ Không có | ✅ Có |
| **Draft Mode** | ❌ Không có | ✅ Có |
| **Preview** | ❌ Không có | ✅ Có |
| **Changelog** | ❌ Không có | ✅ Có |
| **CDN URL** | ❌ Không có | ✅ Per version |
| **Complexity** | 🟢 Đơn giản | 🟡 Trung bình |
| **Setup Time** | 🟢 Nhanh | 🟡 Lâu hơn |
| **Maintenance** | 🔴 Khó | 🟢 Dễ |
| **Scalability** | 🔴 Kém | 🟢 Tốt |

---

## 🔄 Migration Path

### Từ CŨ → MỚI

#### Bước 1: Tạo tables mới
```sql
CREATE TABLE widget_version (...);
CREATE TABLE widget_deployment (...);
CREATE TABLE widget_analytics (...);
```

#### Bước 2: Migrate data
```sql
-- Migrate bot.widget_config → widget_version v1.0.0
INSERT INTO widget_version (bot_id, version, config, ...)
SELECT id, '1.0.0', widget_config, ...
FROM bot
WHERE widget_enabled = true;
```

#### Bước 3: Update code
```typescript
// OLD
const config = await botRepo.findOne({ id: botId });
return config.widgetConfig;

// NEW
const version = await widgetVersionRepo.findOne({
  where: { botId, isActive: true }
});
return version.config;
```

#### Bước 4: Deploy
- Deploy backend mới
- Widget tự động dùng API mới
- Không cần customer update code

#### Bước 5: Cleanup (Optional)
```sql
-- Sau khi chạy ổn định, có thể drop column cũ
ALTER TABLE bot DROP COLUMN widget_config;
```

---

## 🎯 Recommendation

### Cho MVP / Prototype
→ Dùng **Kiến trúc CŨ**
- Nhanh, đơn giản
- Đủ cho testing
- Migrate sau khi có users

### Cho Production
→ Dùng **Kiến trúc MỚI**
- An toàn hơn
- Dễ maintain
- Scale tốt hơn

### Cho dự án này (WataOmi)
→ **Kiến trúc MỚI** 🎯
- Đây là SaaS product
- Cần rollback
- Cần A/B testing
- Cần professional

---

## 💡 Best Practices

### Version Naming
```
Major.Minor.Patch
1.0.0 → Initial release
1.0.1 → Bug fix
1.1.0 → New feature
2.0.0 → Breaking change
```

### Deployment Strategy
```
1. Create draft version
2. Test in preview
3. Publish to 10% traffic (canary)
4. Monitor metrics for 1 hour
5. If OK → scale to 100%
6. If error → rollback
```

### Rollback Policy
```
- Auto-rollback if error rate > 5%
- Auto-rollback if load time > 2s
- Manual rollback anytime
- Keep last 5 versions
- Archive old versions
```

### Analytics Tracking
```
Per version track:
- Load count
- Error count
- Average load time
- Conversion rate
- User feedback
```

---

## 🚀 Implementation Timeline

### Week 1: Setup
- [ ] Create migration
- [ ] Create entities
- [ ] Create repositories

### Week 2: Backend
- [ ] Implement services
- [ ] Implement controllers
- [ ] Write tests

### Week 3: Frontend
- [ ] Build version list UI
- [ ] Build version editor
- [ ] Build deployment UI

### Week 4: Testing
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load tests

### Week 5: Deploy
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Deploy to production

---

## ✅ Kết luận

**Kiến trúc MỚI (Versioning)** là lựa chọn đúng cho production vì:

1. ✅ **Safety**: Rollback nhanh khi có vấn đề
2. ✅ **Visibility**: Biết version nào đang chạy, perform thế nào
3. ✅ **Flexibility**: A/B testing, canary deployment
4. ✅ **Professionalism**: Đúng chuẩn enterprise
5. ✅ **Scalability**: Dễ scale khi có nhiều users

**Trade-off**: Phức tạp hơn một chút, nhưng đáng giá! 🎯
