import { StyleSheet } from "react-native";
import { colors } from "@theme/colors";

export const selectFieldStyles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  field: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldText: {
    fontSize: 18,
    color: colors.textPrimary,
    flex: 1,
  },
  fieldTextPlaceholder: {
    color: colors.textMuted,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlayScrim,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionTitle: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionRowSelected: {
    backgroundColor: colors.background,
  },
  optionList: {
    flexGrow: 1,
  },
});
