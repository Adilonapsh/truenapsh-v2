import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { create } from '@/server/project';
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as z from "zod";



const formSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().min(1, "Description is required"),
    share_option: z.enum(["private", "team", "public"]),
    // Tags will be handled separately
})

type FormValues = z.infer<typeof formSchema>

type Props = {
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    open: boolean

}

const ProjectForm = ({ setOpen, open }: Props) => {

    const [tags, setTags] = useState<string[]>([])
    const [currentTag, setCurrentTag] = useState("")


    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            share_option: "private",
        },
    })

    const handleAddTag = () => {
        if (currentTag.trim() !== "" && !tags.includes(currentTag.trim())) {
            setTags([...tags, currentTag.trim()])
            setCurrentTag("")
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleAddTag()
        }
    }

    const onSubmit = async (data: FormValues) => {
        const formData = {
            ...data,
            tags: JSON.stringify(tags),
        }
        try {
            const data = await toast.promise(
                create(formData),
                {
                    loading: 'Creating project...',
                    success: 'Project created successfully',
                    error: 'Failed to create project'
                }
            );
            if (data) {
                window.location.href = `/map/${data.id}`;
            }
        } catch (err) {
            toast.error('This is an error!');
            console.error(err);
        }

        setTags([])
        form.reset()
        setOpen(false)
    }
    return (
        <div>
            <Dialog
                open={open}
                onOpenChange={(newOpen) => {
                    setOpen(newOpen)
                    if (!newOpen) {
                        form.reset()
                        setTags([])
                        setCurrentTag("")
                    }
                }}
            >
                {/* <DialogTrigger asChild>
                    <Button variant="default">Buat Project Baru</Button>
                </DialogTrigger> */}
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Buat Project Baru</DialogTitle>
                        <DialogDescription>Isi detail project yang ingin Anda buat.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Project</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan nama project" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="tags"
                                        value={currentTag}
                                        onChange={(e) => setCurrentTag(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Tambahkan tag"
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="rounded-full hover:bg-muted p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                    <span className="sr-only">Remove {tag}</span>
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deskripsi</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Jelaskan tentang project Anda" rows={4} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="share_option"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel>Share</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-2"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="private" id="private" />
                                                    <Label htmlFor="private">Private - Only you can access</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="team" id="team" />
                                                    <Label htmlFor="team">Team - Your team members can access</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="public" id="public" />
                                                    <Label htmlFor="public">Public - Anyone with the link can access</Label>
                                                </div>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit">Simpan</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ProjectForm