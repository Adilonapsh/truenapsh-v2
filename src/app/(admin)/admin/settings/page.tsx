"use client"

import type React from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { update, User, userDetails } from "@/server/users"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bell, Code, Eye, EyeOff, Mail, Upload, User as UserIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Define the form schema with Zod
const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    username: z.string()
        .min(8, "Username must be at least 8 characters")
        .max(30, "Username cannot exceed 30 characters")
        .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores and hyphens")
        .trim(),
    email: z.string().email({ message: "Please enter a valid email address" }),
    role: z.string().min(1, { message: "Role is required" }),
    profile_picture: z.instanceof(File).optional(),
})

// Password form schema
const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    })

// Profile form schema
const profileSchema = z.object({
    displayName: z.string().min(2, "Display name must be at least 2 characters"),
    bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
    website: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
    // location: z.string().optional(),
    isPublic: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>
type ProfileFormValues = z.infer<typeof profileSchema>



export default function SettingsPage() {
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [activeTab, setActiveTab] = useState("my-details")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
    const [fileError, setFileError] = useState<string | null>(null)
    const [profile, setProfile] = useState<User | null>(null)

    // Initialize the form
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            username: "",
            role: "",
        },
    })

    // Initialize password form
    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    })

    // Initialize profile form
    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: "",
            bio: "",
            website: "",
            isPublic: true,
        },
    })

    const fetchUsersDetails = async () => {
        try {
            const data = await userDetails();
            setProfile(data);

            form.reset({
                name: data.name,
                email: data.email,
                username: data.username,
                role: "I Dont Know",
            });

            profileForm.reset({
                displayName: data.name,
                bio: data.bio || '',
                website: data.website || '',
                // location: "San Francisco, CA",
                isPublic: true,
            });

        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchUsersDetails();
    }, [form, profileForm, fetchUsersDetails]);

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Clear previous errors
        setFileError(null)

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"]
        if (!validTypes.includes(file.type)) {
            setFileError("Please upload an SVG, PNG, JPG or GIF file.")
            return
        }

        // Validate file size (800x400px is roughly 1MB)
        if (file.size > 1024 * 1024) {
            setFileError("File size should be less than 1MB.")
            return
        }

        // Set the file in the form
        form.setValue("profile_picture", file)

        // Create a preview
        const reader = new FileReader()
        reader.onload = (e) => {
            setProfileImage(e.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    // Handle form submission
    const onSubmit = async (data: FormValues) => {
        setIsUploading(true)
        setFeedback(null)

        try {
            const formData = new FormData()
            Object.entries(data).forEach(([key, value]) => {
                if (value instanceof File) {
                    formData.append(key, value)
                } else {
                    formData.append(key, value as string)
                }
            })

            const response = await update(formData);
            if (response) {
                fetchUsersDetails();
                setFeedback({
                    type: "success",
                    message: "Your profile information has been updated successfully.",
                })
            }
        } catch (error) {
            console.log(error)
            setFeedback({
                type: "error",
                message: "There was an error updating your profile.",
            })
        } finally {
            setIsUploading(false)
        }
    }

    // Handle password form submission
    const onPasswordSubmit = async (data: PasswordFormValues) => {
        setFeedback(null)

        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, value);
            });
            const response = await update(formData);
            if (response) {
                setFeedback({
                    type: "success",
                    message: "Your profile information has been updated successfully.",
                })
            }

            passwordForm.reset({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })
        } catch (error) {
            setFeedback({
                type: "error",
                message: "There was an error updating your password.",
            })
        }
    }

    // Handle profile form submission
    const onProfileSubmit = async (data: ProfileFormValues) => {
        setFeedback(null)

        try {
            console.log("Ini Profile Data", data);
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, typeof value === 'boolean' ? value.toString() : value);
            });

            const response = await update(formData);

            if (response) {
                setFeedback({
                    type: "success",
                    message: "Your profile information has been updated successfully.",
                })
            }

            setFeedback({
                type: "success",
                message: "Your public profile has been updated successfully.",
            })
        } catch (error) {
            setFeedback({
                type: "error",
                message: "There was an error updating your profile.",
            })
        }
    }

    return (
        <div className="container mx-auto py-8 px-4 ">
            <h1 className="text-3xl font-semibold mb-6">Settings</h1>

            {/* Navigation Tabs */}
            <Tabs defaultValue="my-details" value={activeTab} onValueChange={setActiveTab} className="mb-8">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger
                        value="my-details"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary px-4 py-2 h-10"
                    >
                        My details
                    </TabsTrigger>
                    <TabsTrigger
                        value="profile"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary px-4 py-2 h-10"
                    >
                        Profile
                    </TabsTrigger>
                    <TabsTrigger
                        value="password"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary px-4 py-2 h-10"
                    >
                        Password
                    </TabsTrigger>
                    <TabsTrigger
                        value="notifications"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary px-4 py-2 h-10"
                    >
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger
                        value="integrations"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary px-4 py-2 h-10"
                    >
                        Integrations
                    </TabsTrigger>
                    <TabsTrigger
                        value="api"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary px-4 py-2 h-10"
                    >
                        API
                    </TabsTrigger>
                </TabsList>

                {/* Feedback Alert */}
                {feedback && (
                    <Alert
                        className={`mt-4 ${feedback.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}
                    >
                        <AlertTitle>{feedback.type === "success" ? "Success" : "Error"}</AlertTitle>
                        <AlertDescription>{feedback.message}</AlertDescription>
                    </Alert>
                )}

                {/* My Details Tab Content */}
                <TabsContent value="my-details" className="mt-6">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Personal info</h2>
                                <p className="text-muted-foreground text-sm">Update your photo and personal details here.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => form.reset()} disabled={isUploading}>
                                    Cancel
                                </Button>
                                <Button onClick={form.handleSubmit(onSubmit)} disabled={isUploading}>
                                    {isUploading ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>

                        {/* Form */}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8 border-t pt-8">
                                {/* Name */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Username</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                            <UserIcon className="text-[#667085]" />
                                                        </div>
                                                        <Input className="pl-10" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                </div>

                                {/* Email */}
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email address</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                        <Mail className="text-[#667085]" />
                                                    </div>
                                                    <Input className="pl-10" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                                {/* Photo */}
                                <FormField
                                    control={form.control}
                                    name="profile_picture"
                                    render={({ field: { value, onChange, ...fieldProps } }) => (
                                        <FormItem>
                                            <FormLabel>Your photo</FormLabel>
                                            <FormDescription>This will be displayed on your profile.</FormDescription>
                                            <div className="flex items-center gap-6 mt-2">
                                                <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                                                    {profileImage ? (
                                                        <Image
                                                            src={profileImage || `https://api.dicebear.com/9.x/initials/svg?seed=${profile?.name}&backgroundColor=transparent`}
                                                            alt="Profile"
                                                            width={64}
                                                            height={64}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={`https://api.dicebear.com/9.x/initials/svg?seed=${profile?.name}&backgroundColor=transparent`}
                                                            alt="Profile"
                                                            width={64}
                                                            height={64}
                                                            className="object-cover bg-gray-900"
                                                        />
                                                    )}
                                                </div>
                                                <FormControl>
                                                    <div className="flex-1">
                                                        <label
                                                            htmlFor="profile-upload"
                                                            className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                                        >
                                                            <Upload className="h-5 w-5 text-blue-600 mb-2" />
                                                            <div className="text-sm font-medium text-blue-600">Click to upload</div>
                                                            <div className="text-xs text-muted-foreground">or drag and drop</div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                SVG, PNG, JPG or GIF (max. 800x400px)
                                                            </div>
                                                            <input
                                                                id="profile-upload"
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/png, image/jpeg, image/gif, image/svg+xml"
                                                                onChange={(e) => {
                                                                    handleFileUpload(e)
                                                                    // This ensures React Hook Form knows about the file
                                                                    if (e.target.files?.[0]) {
                                                                        onChange(e.target.files[0])
                                                                    }
                                                                }}
                                                                {...fieldProps}
                                                            />
                                                        </label>
                                                        {fileError && <p className="text-sm text-red-500 mt-2">{fileError}</p>}
                                                    </div>
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Role */}
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your role" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </div>
                </TabsContent>

                {/* Profile Tab Content */}
                <TabsContent value="profile" className="mt-6">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Public profile</h2>
                                <p className="text-muted-foreground text-sm">This information will be displayed publicly.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => profileForm.reset()}>
                                    Cancel
                                </Button>
                                <Button onClick={profileForm.handleSubmit(onProfileSubmit)}>Save</Button>
                            </div>
                        </div>

                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8 mt-8 border-t pt-8">
                                <FormField
                                    control={profileForm.control}
                                    name="displayName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Display name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Display name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={profileForm.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bio</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tell us about yourself" {...field} />
                                            </FormControl>
                                            <FormDescription>Brief description for your profile. URLs are hyperlinked.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={profileForm.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={profileForm.control}
                                    name="isPublic"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Public profile</FormLabel>
                                                <FormDescription>Make your profile visible to everyone</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </div>
                </TabsContent>

                {/* Password Tab Content */}
                <TabsContent value="password" className="mt-6">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Password</h2>
                                <p className="text-muted-foreground text-sm">Update your password here.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => passwordForm.reset()}>
                                    Cancel
                                </Button>
                                <Button onClick={passwordForm.handleSubmit(onPasswordSubmit)}>Update password</Button>
                            </div>
                        </div>

                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-8 mt-8 border-t pt-8">
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type={showCurrentPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    >
                                                        {showCurrentPassword ? (
                                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        <span className="sr-only">{showCurrentPassword ? "Hide password" : "Show password"}</span>
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type={showNewPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                    >
                                                        {showNewPassword ? (
                                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        <span className="sr-only">{showNewPassword ? "Hide password" : "Show password"}</span>
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Password must be at least 8 characters and include uppercase, lowercase, number and special
                                                character.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        {showConfirmPassword ? (
                                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </div>
                </TabsContent>

                {/* Notifications Tab Content */}
                <TabsContent value="notifications" className="mt-6">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Notification preferences</h2>
                                <p className="text-muted-foreground text-sm">Manage how you receive notifications.</p>
                            </div>
                            <Button>Save changes</Button>
                        </div>

                        <div className="space-y-8 mt-8 border-t pt-8">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Email notifications</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-3">
                                            <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="font-medium">Comments</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Get notified when someone comments on your posts.
                                                </p>
                                            </div>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-3">
                                            <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="font-medium">Mentions</p>
                                                <p className="text-sm text-muted-foreground">Get notified when someone mentions you.</p>
                                            </div>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-3">
                                            <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="font-medium">Updates</p>
                                                <p className="text-sm text-muted-foreground">Get product updates and announcements.</p>
                                            </div>
                                        </div>
                                        <Switch />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium mb-4">Push notifications</h3>
                                <p className="text-sm text-muted-foreground mb-4">These are delivered via SMS to your mobile phone.</p>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="push-everything" />
                                        <label
                                            htmlFor="push-everything"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Everything
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="push-mentions" defaultChecked />
                                        <label
                                            htmlFor="push-mentions"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Mentions and replies
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="push-nothing" />
                                        <label
                                            htmlFor="push-nothing"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Nothing
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Integrations Tab Content */}
                <TabsContent value="integrations" className="mt-6">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Connected services</h2>
                                <p className="text-muted-foreground text-sm">Manage your connected accounts and services.</p>
                            </div>
                        </div>

                        <div className="space-y-6 mt-8 border-t pt-8">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-slate-100 p-2 rounded-md">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="text-slate-600"
                                            >
                                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <CardTitle>GitHub</CardTitle>
                                            <CardDescription>Manage your GitHub repositories access.</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Disconnect
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Connected as oliviarhye</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-slate-100 p-2 rounded-md">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="text-slate-600"
                                            >
                                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                                <rect x="2" y="9" width="4" height="12"></rect>
                                                <circle cx="4" cy="4" r="2"></circle>
                                            </svg>
                                        </div>
                                        <div>
                                            <CardTitle>LinkedIn</CardTitle>
                                            <CardDescription>Manage your LinkedIn account connection.</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Connect
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Not connected</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-slate-100 p-2 rounded-md">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="text-slate-600"
                                            >
                                                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <CardTitle>Twitter</CardTitle>
                                            <CardDescription>Manage your Twitter account connection.</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Connect
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Not connected</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* API Tab Content */}
                <TabsContent value="api" className="mt-6">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">API Keys</h2>
                                <p className="text-muted-foreground text-sm">Manage your API keys for development.</p>
                            </div>
                            <Button>Create new key</Button>
                        </div>

                        <div className="space-y-6 mt-8 border-t pt-8">
                            <div className="rounded-md border">
                                <div className="p-4 flex flex-col space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium">Production API Key</h3>
                                            <p className="text-sm text-muted-foreground">Use this key for your production environment</p>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            Regenerate
                                        </Button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Input value="sk_prod_Tds32$%dsa43dsaA32" readOnly className="font-mono" />
                                        <Button size="sm" variant="ghost">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                            <span className="sr-only">Copy</span>
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Last used: 2 days ago</p>
                                </div>
                            </div>

                            <div className="rounded-md border">
                                <div className="p-4 flex flex-col space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium">Development API Key</h3>
                                            <p className="text-sm text-muted-foreground">Use this key for testing and development</p>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            Regenerate
                                        </Button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Input value="sk_dev_Fsd78^%dsa43dsaG65" readOnly className="font-mono" />
                                        <Button size="sm" variant="ghost">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                            <span className="sr-only">Copy</span>
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Last used: 5 hours ago</p>
                                </div>
                            </div>

                            <div className="rounded-md bg-muted/50 p-4">
                                <div className="flex items-start space-x-4">
                                    <Code className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <h3 className="font-medium">API Documentation</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            View our comprehensive API documentation to integrate our services with your application.
                                        </p>
                                        <Button variant="link" className="px-0 py-1 h-auto">
                                            View documentation
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

