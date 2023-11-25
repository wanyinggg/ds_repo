from rest_framework import permissions

# class IsAdminUser(permissions.BasePermission):
#     """
#     Custom permission to only allow admin users to access a view.
#     """

#     def has_permission(self, request, view):
#         # Only allow admin users.
#         # print('user role', request.user.role)
#         if request.user.is_authenticated:
#             return request.user.roles.filter(name='admin').exists()

#         return False
    
class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Student').exists()

    def has_object_permission(self, request, view, obj):
        return request.user.groups.filter(name='Student').exists()

class IsSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Supervisor').exists()

    def has_object_permission(self, request, view, obj):
        return request.user.groups.filter(name='Supervisor').exists()
