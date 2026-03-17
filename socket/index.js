const socketAuthMiddleware = require("./auth");
const Conversation = require("../models/conversations");
const Message = require("../models/messages");
const Teacher = require("../models/teachers");
const Student = require("../models/students");
const canUserAccessConversation = require("./canAccessConversation");

function registerMessagingSocket(io) {
  io.use(socketAuthMiddleware);

  io.on("connection", async (socket) => {
    try {
      console.log("Socket connected:", socket.id, socket.user);

      // room utilisateur pour notifs globales
      socket.join(`user_${socket.user.userId}`);

      socket.on("join_conversation", async ({ conversationId }) => {
        try {
          if (!conversationId) {
            return socket.emit("socket_error", {
              message: "conversationId is required",
            });
          }

          const conversation = await Conversation.findById(conversationId);

          if (!conversation) {
            return socket.emit("socket_error", {
              message: "Conversation not found",
            });
          }

          const canAccess = await canUserAccessConversation(
            socket.user,
            conversation,
          );

          if (!canAccess) {
            return socket.emit("socket_error", {
              message: "Access denied",
            });
          }

          socket.join(`conversation_${conversationId}`);

          socket.emit("joined_conversation", {
            conversationId,
          });
        } catch (error) {
          console.error("join_conversation error:", error);
          socket.emit("socket_error", {
            message: "Unable to join conversation",
          });
        }
      });

      socket.on("leave_conversation", ({ conversationId }) => {
        if (!conversationId) return;
        socket.leave(`conversation_${conversationId}`);
      });

      socket.on("send_message", async ({ conversationId, content }) => {
        try {
          if (!conversationId || !content || !content.trim()) {
            return socket.emit("socket_error", {
              message: "conversationId and content are required",
            });
          }

          const conversation = await Conversation.findById(conversationId);

          if (!conversation) {
            return socket.emit("socket_error", {
              message: "Conversation not found",
            });
          }

          const canAccess = await canUserAccessConversation(
            socket.user,
            conversation,
          );

          if (!canAccess) {
            return socket.emit("socket_error", {
              message: "Access denied",
            });
          }

          const cleanContent = content.trim();
          const senderRole = socket.user.role;

          const message = await Message.create({
            conversation: conversation._id,
            senderUser: socket.user.userId,
            senderRole,
            content: cleanContent,
            readBy: [senderRole],
          });

          conversation.lastMessage = cleanContent;
          conversation.lastMessageAt = message.createdAt;
          conversation.lastSenderRole = senderRole;
          await conversation.save();

          const populatedMessage = await Message.findById(message._id);

          io.to(`conversation_${conversationId}`).emit("new_message", {
            _id: populatedMessage._id,
            conversation: populatedMessage.conversation,
            senderUser: populatedMessage.senderUser,
            senderRole: populatedMessage.senderRole,
            content: populatedMessage.content,
            readBy: populatedMessage.readBy,
            createdAt: populatedMessage.createdAt,
            updatedAt: populatedMessage.updatedAt,
          });

          // notif globale au destinataire
          if (senderRole === "teacher") {
            const student = await Student.findById(
              conversation.student,
            ).populate("user");
            if (student?.user?._id) {
              io.to(`user_${student.user._id}`).emit(
                "new_message_notification",
                {
                  conversationId: String(conversation._id),
                  fromRole: "teacher",
                  preview: cleanContent,
                  createdAt: message.createdAt,
                },
              );
            }
          } else if (senderRole === "student") {
            const teacher = await Teacher.findById(
              conversation.teacher,
            ).populate("user");
            if (teacher?.user?._id) {
              io.to(`user_${teacher.user._id}`).emit(
                "new_message_notification",
                {
                  conversationId: String(conversation._id),
                  fromRole: "student",
                  preview: cleanContent,
                  createdAt: message.createdAt,
                },
              );
            }
          }

          io.to(`conversation_${conversationId}`).emit("conversation_updated", {
            conversationId: String(conversation._id),
            lastMessage: cleanContent,
            lastMessageAt: message.createdAt,
            lastSenderRole: senderRole,
          });
        } catch (error) {
          console.error("send_message error:", error);
          socket.emit("socket_error", {
            message: "Unable to send message",
          });
        }
      });

      socket.on("messages_read", async ({ conversationId }) => {
        try {
          if (!conversationId) return;

          const conversation = await Conversation.findById(conversationId);
          if (!conversation) return;

          const canAccess = await canUserAccessConversation(
            socket.user,
            conversation,
          );

          if (!canAccess) return;

          await Message.updateMany(
            {
              conversation: conversationId,
              senderRole: { $ne: socket.user.role },
              readBy: { $ne: socket.user.role },
            },
            {
              $addToSet: { readBy: socket.user.role },
            },
          );

          io.to(`conversation_${conversationId}`).emit("messages_read_update", {
            conversationId,
            readBy: socket.user.role,
          });
        } catch (error) {
          console.error("messages_read error:", error);
        }
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    } catch (error) {
      console.error("socket connection setup error:", error);
    }
  });
}

module.exports = registerMessagingSocket;
