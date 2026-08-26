import { useDialog } from "@/components/admin/dialog";
import { Field, ModalSheet, fieldStyles } from "@/components/admin/modal-sheet";
import { PageHeader, styles as parts } from "@/components/admin/screen-parts";
import {
  Button,
  Card,
  FadeIn,
  Icon,
  IconButton,
  SectionTitle,
  Toggle,
} from "@/components/admin/ui";
import { Admin } from "@/constants/admin-theme";
import { BRAND } from "@/constants/menu-catalog";
import {
  OWNER_LOGINS,
  useAdminSession,
  type StaffMember,
} from "@/context/AdminSession";
import { useResponsive } from "@/hooks/use-responsive";
import React, { useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AdminSettingsScreen() {
  const { isPhone } = useResponsive();
  const { confirm, notify } = useDialog();
  const { user, staff, addStaff, updateStaff, removeStaff, regenerateCode } =
    useAdminSession();

  const isOwner = user?.role === "owner";

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  /** The member whose invite is being shown after onboarding. */
  const [invite, setInvite] = useState<StaffMember | null>(null);

  const inviteText = (member: StaffMember) =>
    `Hi ${member.name.split(" ")[0]}, you have been added to The Burger Yard admin console.\n\n` +
    `Open the console, choose "Log in as Staff", pick your name and enter this code:\n\n` +
    `${member.code}\n\n` +
    `Keep it to yourself. It only works for your name.`;

  const sendInvite = (member: StaffMember, via: "whatsapp" | "sms") => {
    const body = encodeURIComponent(inviteText(member));
    const intl = `233${member.phone.replace(/^0/, "")}`;
    Linking.openURL(
      via === "whatsapp" ? `https://wa.me/${intl}?text=${body}` : `sms:${member.phone}?body=${body}`,
    );
  };

  const handleAdd = () => {
    if (!name.trim()) {
      notify({ title: "Name required", message: "Enter the worker's name." });
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      notify({
        title: "Check the phone number",
        message: "Enter the number the invite should go to.",
      });
      return;
    }
    const created = addStaff(name, phone);
    if (!created) {
      notify({
        title: "Could not add",
        message: "No free code available. Remove an old member first.",
      });
      return;
    }
    setName("");
    setPhone("");
    setAdding(false);
    setInvite(created);
  };

  const confirmRemove = async (member: StaffMember) => {
    const ok = await confirm({
      title: "Remove worker",
      message: `Remove ${member.name} for good? Their code stops working and they are signed out.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) removeStaff(member.id);
  };

  /** Blocking keeps the record but refuses the code at sign in. */
  const toggleBlock = async (member: StaffMember) => {
    if (member.active) {
      const ok = await confirm({
        title: `Block ${member.name.split(" ")[0]}?`,
        message:
          "Their code stops working immediately and their name is hidden from the sign in list. You can unblock them at any time.",
        confirmLabel: "Block",
        destructive: true,
        icon: "slash",
      });
      if (ok) updateStaff(member.id, { active: false });
    } else {
      updateStaff(member.id, { active: true });
    }
  };

  const newCode = (member: StaffMember) => {
    const code = regenerateCode(member.id);
    if (code) setInvite({ ...member, code });
  };

  return (
    <View style={parts.screen}>
      <ScrollView
        contentContainerStyle={[parts.scroll, isPhone && parts.scrollPhone]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageHeader
          title="Settings"
          subtitle={isOwner ? "Business, team and access" : "Your account"}
        />

        {/* Profile */}
        <FadeIn>
          <Card>
            <SectionTitle title="Signed in as" />
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.initials ?? "--"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user?.name}</Text>
                <Text style={styles.profileRole}>{user?.title}</Text>
              </View>
              <View style={[styles.roleTag, isOwner && styles.roleTagOwner]}>
                <Icon
                  name={isOwner ? "shield" : "user"}
                  size={12}
                  color={isOwner ? Admin.red : Admin.textMuted}
                />
                <Text style={[styles.roleTagText, isOwner && { color: Admin.red }]}>
                  {isOwner ? "Manager" : "Staff"}
                </Text>
              </View>
            </View>
          </Card>
        </FadeIn>

        {/* Manager logins - owner only */}
        {isOwner && (
          <FadeIn delay={60}>
            <Card>
              <SectionTitle
                title="Manager logins"
                subtitle="Two addresses, identical access"
              />
              <View style={styles.loginRow}>
                <View style={styles.loginIcon}>
                  <Icon name="mail" size={15} color={Admin.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.loginLabel}>Everyday</Text>
                  <Text style={styles.loginValue}>{OWNER_LOGINS.primary}</Text>
                </View>
              </View>
              <View style={styles.loginRow}>
                <View style={styles.loginIcon}>
                  <Icon name="life-buoy" size={15} color={Admin.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.loginLabel}>Standby / recovery</Text>
                  <Text style={styles.loginValue}>{OWNER_LOGINS.recovery}</Text>
                </View>
              </View>
              <Text style={styles.loginHint}>
                Keep the standby address on a different mailbox. If the everyday
                password is lost, it is the way back in.
              </Text>
            </Card>
          </FadeIn>
        )}

        {/* Team - owner only */}
        {isOwner && (
          <FadeIn delay={110}>
            <Card>
              <SectionTitle
                title="Team"
                subtitle={`${staff.filter((m) => m.active).length} of ${staff.length} can sign in · each has their own code`}
                right={<Button label="Add worker" icon="user-plus" size="sm" onPress={() => setAdding(true)} />}
              />

              {staff.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Icon name="users" size={22} color={Admin.textFaint} />
                  <Text style={styles.emptyText}>
                    Nobody onboarded yet. Add a worker to send their first invite.
                  </Text>
                </View>
              ) : (
                staff.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </Text>
                    </View>

                    <View style={{ flex: 1, minWidth: 130 }}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {!member.active && (
                          <View style={styles.blockedTag}>
                            <Icon name="slash" size={9} color={Admin.red} />
                            <Text style={styles.blockedTagText}>Blocked</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberMeta}>
                        {member.phone} · invited {member.invitedOn}
                      </Text>
                    </View>

                    <View style={styles.codeChip}>
                      <Icon name="key" size={11} color={Admin.textMuted} />
                      <Text style={styles.codeChipText}>{member.code}</Text>
                    </View>

                    <View style={styles.memberActions}>
                      <Toggle
                        value={member.active}
                        onChange={() => toggleBlock(member)}
                        label={`${member.name} can sign in`}
                      />
                      <IconButton
                        name="send"
                        label={`Send invite to ${member.name}`}
                        onPress={() => setInvite(member)}
                      />
                      <IconButton
                        name="trash-2"
                        tone="danger"
                        label={`Remove ${member.name}`}
                        onPress={() => confirmRemove(member)}
                      />
                    </View>
                  </View>
                ))
              )}
            </Card>
          </FadeIn>
        )}

        {/* Business */}
        <FadeIn delay={160}>
          <Card>
            <SectionTitle title="Business" />
            <View style={styles.bizRow}>
              <Image source={BRAND.logo} style={styles.bizLogo} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>The Burger Yard</Text>
                <Text style={styles.profileRole}>Ayeduase New Site · Kumasi</Text>
              </View>
            </View>
            <View style={styles.bizGrid}>
              <View style={styles.bizItem}>
                <Text style={styles.bizLabel}>Call line</Text>
                <Text style={styles.bizValue}>054 392 7440</Text>
              </View>
              <View style={styles.bizItem}>
                <Text style={styles.bizLabel}>WhatsApp</Text>
                <Text style={styles.bizValue}>027 891 6248</Text>
              </View>
              <View style={styles.bizItem}>
                <Text style={styles.bizLabel}>Currency</Text>
                <Text style={styles.bizValue}>GHS</Text>
              </View>
            </View>
          </Card>
        </FadeIn>

        {!isOwner && (
          <FadeIn delay={200}>
            <Card style={styles.staffNote}>
              <Icon name="lock" size={16} color={Admin.textMuted} />
              <Text style={styles.staffNoteText}>
                Sales, payments and reports are limited to the manager. Ask the
                owner if you need a figure from them.
              </Text>
            </Card>
          </FadeIn>
        )}
      </ScrollView>

      {/* Add worker */}
      <ModalSheet
        visible={adding}
        title="Add a worker"
        subtitle="They get a 4-digit code that only works for their name."
        onClose={() => setAdding(false)}
        footer={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => setAdding(false)} />
            <Button label="Create invite" onPress={handleAdd} />
          </>
        }
      >
        <Field label="Full name">
          <TextInput
            style={fieldStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ama Boakye"
            placeholderTextColor={Admin.textFaint}
            autoCapitalize="words"
          />
        </Field>
        <Field label="Phone number">
          <TextInput
            style={fieldStyles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="0244 112 233"
            placeholderTextColor={Admin.textFaint}
            keyboardType="phone-pad"
          />
        </Field>
        <Text style={styles.formHint}>
          The code is generated for them and checked against their name only, so
          one worker&apos;s code cannot sign in as another.
        </Text>
      </ModalSheet>

      {/* Invite, shown after onboarding or when resending */}
      <ModalSheet
        visible={invite !== null}
        title={`Invite for ${invite?.name ?? ""}`}
        subtitle="Send this to them. It is their only credential."
        onClose={() => setInvite(null)}
        footer={
          <>
            <Button label="Done" variant="secondary" onPress={() => setInvite(null)} />
            {invite ? (
              <Button
                label="Send on WhatsApp"
                icon="message-circle"
                onPress={() => sendInvite(invite, "whatsapp")}
              />
            ) : null}
          </>
        }
      >
        {invite && (
          <>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeDisplayLabel}>THEIR CODE</Text>
              <Text style={styles.codeDisplayValue}>{invite.code}</Text>
              <Text style={styles.codeDisplayHint}>
                Works only when {invite.name.split(" ")[0]} is the selected name.
              </Text>
            </View>

            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{inviteText(invite)}</Text>
            </View>

            <View style={styles.inviteActions}>
              <Button
                label="Send by SMS"
                icon="message-square"
                variant="secondary"
                size="sm"
                onPress={() => sendInvite(invite, "sms")}
                style={{ flex: 1 }}
              />
              <Button
                label="New code"
                icon="refresh-cw"
                variant="secondary"
                size="sm"
                onPress={() => newCode(invite)}
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  profileRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Admin.redSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800", color: Admin.red },
  profileName: { fontSize: 15, fontWeight: "700", color: Admin.text },
  profileRole: { fontSize: 12, color: Admin.textMuted, marginTop: 3 },
  roleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Admin.divider,
  },
  roleTagOwner: { backgroundColor: Admin.redSoft },
  roleTagText: { fontSize: 11.5, fontWeight: "700", color: Admin.textMuted },

  loginRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  loginIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Admin.redSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  loginLabel: { fontSize: 11, fontWeight: "700", color: Admin.textFaint, letterSpacing: 0.4 },
  loginValue: { fontSize: 13.5, color: Admin.text, fontWeight: "600", marginTop: 2 },
  loginHint: { fontSize: 11.5, color: Admin.textMuted, lineHeight: 17, marginTop: 4 },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: Admin.divider,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Admin.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: { fontSize: 12, fontWeight: "800", color: Admin.textMuted },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  memberName: { fontSize: 13.5, fontWeight: "700", color: Admin.text },
  blockedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: Admin.redSoft,
  },
  blockedTagText: { fontSize: 9.5, fontWeight: "800", color: Admin.red },
  memberMeta: { fontSize: 11.5, color: Admin.textMuted, marginTop: 2 },
  codeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: Admin.divider,
  },
  codeChipText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: Admin.text,
    letterSpacing: 1.5,
  },
  memberActions: { flexDirection: "row", alignItems: "center", gap: 8 },

  bizRow: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 16 },
  bizLogo: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#FFFFFF" },
  bizGrid: { flexDirection: "row", flexWrap: "wrap", gap: 22 },
  bizItem: { minWidth: 120 },
  bizLabel: { fontSize: 11, color: Admin.textFaint, fontWeight: "700", letterSpacing: 0.4 },
  bizValue: { fontSize: 13, color: Admin.text, fontWeight: "600", marginTop: 4 },

  emptyBox: { alignItems: "center", gap: 10, paddingVertical: 30 },
  emptyText: { fontSize: 12.5, color: Admin.textMuted, textAlign: "center", maxWidth: 260 },

  formHint: { fontSize: 11.5, color: Admin.textMuted, lineHeight: 17, marginBottom: 6 },

  codeDisplay: {
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    backgroundColor: Admin.redSoft,
    borderWidth: 1,
    borderColor: "#F7C9C9",
    marginBottom: 16,
  },
  codeDisplayLabel: { fontSize: 10, fontWeight: "800", color: Admin.red, letterSpacing: 1 },
  codeDisplayValue: {
    fontSize: 40,
    fontWeight: "800",
    color: Admin.red,
    letterSpacing: 10,
    marginTop: 8,
  },
  codeDisplayHint: { fontSize: 11.5, color: Admin.textMuted, marginTop: 8, textAlign: "center" },

  messageBox: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#FBFCFD",
    borderWidth: 1,
    borderColor: Admin.border,
    marginBottom: 14,
  },
  messageText: { fontSize: 12, color: Admin.textMuted, lineHeight: 18 },
  inviteActions: { flexDirection: "row", gap: 10, marginBottom: 6 },

  staffNote: { flexDirection: "row", alignItems: "center", gap: 12 },
  staffNoteText: { flex: 1, fontSize: 12.5, color: Admin.textMuted, lineHeight: 18 },
});
